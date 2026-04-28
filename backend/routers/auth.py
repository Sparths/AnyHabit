from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_current_user, get_db
from ..security import clear_auth_cookie, create_access_token, hash_password, set_auth_cookie, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.AuthResponse)
def register(payload: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    normalized_username = payload.username.strip()

    if not normalized_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is required")

    existing_user = (
        db.query(models.User)
        .filter((models.User.email == normalized_email) | (models.User.username == normalized_username))
        .first()
    )
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    user = models.User(
        username=normalized_username,
        email=normalized_email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)
    return schemas.AuthResponse(access_token=token, user=user)


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    normalized_identifier = payload.identifier.strip().lower()

    user = (
        db.query(models.User)
        .filter((models.User.email == normalized_identifier) | (models.User.username == payload.identifier.strip()))
        .first()
    )
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")

    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)
    return schemas.AuthResponse(access_token=token, user=user)


@router.get("/me", response_model=schemas.User)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out"}
