from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from . import models


def get_group_membership(db: Session, user_id: int, group_id: int) -> models.GroupMember | None:
    return (
        db.query(models.GroupMember)
        .filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == user_id)
        .first()
    )


def get_tracker_participant(db: Session, tracker_id: int, user_id: int) -> models.TrackerParticipant | None:
    return (
        db.query(models.TrackerParticipant)
        .filter(models.TrackerParticipant.tracker_id == tracker_id, models.TrackerParticipant.user_id == user_id)
        .first()
    )


def get_tracker_or_404(db: Session, tracker_id: int) -> models.Tracker:
    tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if tracker is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracker not found")
    return tracker


def can_view_group(db: Session, user_id: int, group_id: int) -> bool:
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if group is None:
        return False
    return group.owner_id == user_id or get_group_membership(db, user_id, group_id) is not None


def can_access_tracker(db: Session, user_id: int, tracker: models.Tracker) -> bool:
    if tracker.owner_id == user_id:
        return True
    if tracker.group_id is not None and can_view_group(db, user_id, tracker.group_id):
        return True
    if get_tracker_participant(db, tracker.id, user_id) is not None:
        return True
    return False


def require_tracker_access(db: Session, user_id: int, tracker_id: int, write: bool = False) -> models.Tracker:
    tracker = get_tracker_or_404(db, tracker_id)
    if not can_access_tracker(db, user_id, tracker):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this tracker")
    if write and tracker.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the tracker owner can modify it")
    return tracker
