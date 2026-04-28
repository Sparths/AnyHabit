from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..access import can_view_group
from ..deps import get_current_user, get_db
from ..time_utils import utcnow_naive

router = APIRouter(prefix="/groups", tags=["groups"])


def _generate_join_code() -> str:
    return secrets.token_urlsafe(6).replace("-", "").replace("_", "").upper()[:8]


def _serialize_group(db: Session, group: models.Group) -> schemas.Group:
    members = (
        db.query(models.GroupMember, models.User)
        .join(models.User, models.User.id == models.GroupMember.user_id)
        .filter(models.GroupMember.group_id == group.id)
        .order_by(models.GroupMember.joined_at.asc())
        .all()
    )

    serialized_members = [
        schemas.GroupMember(
            user=schemas.User.model_validate(user),
            role=member.role,
            joined_at=member.joined_at,
        )
        for member, user in members
    ]

    return schemas.Group(
        id=group.id,
        name=group.name,
        join_code=group.join_code,
        owner_id=group.owner_id,
        member_count=len(serialized_members),
        members=serialized_members,
    )


@router.get("/", response_model=list[schemas.Group])
def read_groups(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    groups = (
        db.query(models.Group)
        .join(models.GroupMember, models.GroupMember.group_id == models.Group.id, isouter=True)
        .filter((models.Group.owner_id == current_user.id) | (models.GroupMember.user_id == current_user.id))
        .distinct()
        .order_by(models.Group.created_at.desc())
        .all()
    )
    return [_serialize_group(db, group) for group in groups]


@router.post("/", response_model=schemas.Group)
def create_group(
    payload: schemas.GroupCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    join_code = _generate_join_code()
    while db.query(models.Group).filter(models.Group.join_code == join_code).first() is not None:
        join_code = _generate_join_code()

    group = models.Group(name=payload.name.strip(), join_code=join_code, owner_id=current_user.id)
    db.add(group)
    db.commit()
    db.refresh(group)

    membership = models.GroupMember(group_id=group.id, user_id=current_user.id, role="owner", joined_at=utcnow_naive())
    db.add(membership)
    db.commit()

    return _serialize_group(db, group)


@router.post("/join", response_model=schemas.Group)
def join_group(
    payload: schemas.GroupJoin,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(models.Group).filter(models.Group.join_code == payload.join_code.strip().upper()).first()
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    existing_membership = (
        db.query(models.GroupMember)
        .filter(models.GroupMember.group_id == group.id, models.GroupMember.user_id == current_user.id)
        .first()
    )
    if existing_membership is None:
        db.add(models.GroupMember(group_id=group.id, user_id=current_user.id, role="member", joined_at=utcnow_naive()))
        db.commit()

    return _serialize_group(db, group)


@router.get("/{group_id}", response_model=schemas.Group)
def read_group(
    group_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if not can_view_group(db, current_user.id, group_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this group")

    return _serialize_group(db, group)


@router.get("/{group_id}/members", response_model=list[schemas.GroupMember])
def read_group_members(
    group_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if not can_view_group(db, current_user.id, group_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this group")

    memberships = (
        db.query(models.GroupMember, models.User)
        .join(models.User, models.User.id == models.GroupMember.user_id)
        .filter(models.GroupMember.group_id == group_id)
        .order_by(models.GroupMember.joined_at.asc())
        .all()
    )
    return [
        schemas.GroupMember(
            user=schemas.User.model_validate(user),
            role=membership.role,
            joined_at=membership.joined_at,
        )
        for membership, user in memberships
    ]
