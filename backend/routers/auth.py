from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_current_user, get_db
from ..security import (
    clear_auth_cookie,
    create_access_token,
    hash_password,
    login_throttle,
    set_auth_cookie,
    throttle_key,
    verify_password,
)
from ..time_utils import is_valid_timezone

router = APIRouter(prefix="/auth", tags=["auth"])


def registration_is_enabled() -> bool:
    return os.environ.get("ANYHABIT_ALLOW_REGISTRATION", "true").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


@router.get("/config")
def read_auth_config():
    return {"registration_enabled": registration_is_enabled()}


@router.post("/register", response_model=schemas.AuthResponse)
def register(payload: schemas.UserCreate, response: Response, request: Request, db: Session = Depends(get_db)):
    if not registration_is_enabled():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="New account registration is disabled by the server administrator",
        )

    # Email and username are normalised by the schema validators.
    existing_user = (
        db.query(models.User)
        .filter((models.User.email == payload.email) | (models.User.username == payload.username))
        .first()
    )
    if existing_user is not None:
        # Naming which field collided is friendlier than a blanket rejection and
        # leaks nothing an attacker could not learn from the registration form.
        conflict = "email address" if existing_user.email == payload.email else "username"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=f"That {conflict} is already taken"
        )

    user = models.User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        timezone="UTC",
        week_start="monday",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token, request)
    return schemas.AuthResponse(access_token=token, user=user)


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin, response: Response, request: Request, db: Session = Depends(get_db)):
    identifier = payload.identifier.strip()
    key = throttle_key(request, identifier)

    locked_for = login_throttle.seconds_remaining(key)
    if locked_for:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed sign-in attempts. Try again in {locked_for} seconds.",
            headers={"Retry-After": str(locked_for)},
        )

    user = (
        db.query(models.User)
        .filter((models.User.email == identifier.lower()) | (models.User.username == identifier))
        .first()
    )

    if user is None or not verify_password(payload.password, user.password_hash):
        login_throttle.record_failure(key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")

    login_throttle.reset(key)
    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token, request)
    return schemas.AuthResponse(access_token=token, user=user)


@router.get("/me", response_model=schemas.User)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=schemas.User)
def update_preferences(
    payload: schemas.UserPreferences,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update display preferences.

    Changing the timezone re-buckets every streak and window on the next read;
    nothing stored is rewritten, so switching back restores the old numbers.
    """
    if payload.timezone is not None:
        if not is_valid_timezone(payload.timezone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{payload.timezone}' is not a recognised timezone",
            )
        current_user.timezone = payload.timezone

    if payload.week_start is not None:
        current_user.week_start = payload.week_start

    if payload.username is not None:
        username = payload.username.strip()
        if not username:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is required")

        clash = (
            db.query(models.User)
            .filter(models.User.username == username, models.User.id != current_user.id)
            .first()
        )
        if clash is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That username is already taken")
        current_user.username = username

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/password")
def change_password(
    payload: schemas.PasswordChange,
    response: Response,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your current password is incorrect")

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="The new password must differ from the current one"
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()

    # Re-issue the session so the cookie the browser holds matches the new
    # credentials rather than silently outliving them.
    token = create_access_token({"sub": str(current_user.id)})
    set_auth_cookie(response, token, request)
    return {"message": "Password updated"}


@router.delete("/me")
def delete_account(
    response: Response,
    request: Request,
    confirm_username: str = "",
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete the signed-in account and everything it owns.

    Requires the username to be typed back, because there is no undo and no
    other copy of the data beyond whatever the operator has exported.
    """
    if confirm_username.strip() != current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type your username exactly to confirm account deletion",
        )

    user_id = current_user.id
    owned_tracker_ids = [
        row[0] for row in db.query(models.Tracker.id).filter(models.Tracker.owner_id == user_id).all()
    ]

    if owned_tracker_ids:
        db.query(models.HabitLog).filter(models.HabitLog.tracker_id.in_(owned_tracker_ids)).delete(
            synchronize_session=False
        )
        db.query(models.JournalEntry).filter(models.JournalEntry.tracker_id.in_(owned_tracker_ids)).delete(
            synchronize_session=False
        )
        db.query(models.TrackerParticipant).filter(
            models.TrackerParticipant.tracker_id.in_(owned_tracker_ids)
        ).delete(synchronize_session=False)
        db.query(models.Tracker).filter(models.Tracker.id.in_(owned_tracker_ids)).delete(synchronize_session=False)

    # Activity this user contributed to *other people's* shared trackers goes
    # too — leaving it behind would keep personal entries readable to the group.
    db.query(models.HabitLog).filter(models.HabitLog.user_id == user_id).delete(synchronize_session=False)
    db.query(models.JournalEntry).filter(models.JournalEntry.user_id == user_id).delete(synchronize_session=False)
    db.query(models.TrackerParticipant).filter(models.TrackerParticipant.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(models.UserDashboardState).filter(models.UserDashboardState.user_id == user_id).delete(
        synchronize_session=False
    )

    owned_group_ids = [row[0] for row in db.query(models.Group.id).filter(models.Group.owner_id == user_id).all()]
    if owned_group_ids:
        db.query(models.Tracker).filter(models.Tracker.group_id.in_(owned_group_ids)).update(
            {models.Tracker.group_id: None, models.Tracker.visibility: "private"}, synchronize_session=False
        )
        db.query(models.GroupMember).filter(models.GroupMember.group_id.in_(owned_group_ids)).delete(
            synchronize_session=False
        )
        db.query(models.Group).filter(models.Group.id.in_(owned_group_ids)).delete(synchronize_session=False)

    db.query(models.GroupMember).filter(models.GroupMember.user_id == user_id).delete(synchronize_session=False)
    db.query(models.User).filter(models.User.id == user_id).delete(synchronize_session=False)
    db.commit()

    clear_auth_cookie(response, request)
    return {"message": "Account deleted"}


@router.post("/logout")
def logout(response: Response, request: Request):
    clear_auth_cookie(response, request)
    return {"message": "Logged out"}
