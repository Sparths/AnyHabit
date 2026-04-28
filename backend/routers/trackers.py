from __future__ import annotations

from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..access import can_view_group, get_tracker_or_404, require_tracker_access
from ..analytics import build_tracker_analytics
from ..deps import get_current_user, get_db
from ..time_utils import to_utc, utcnow

router = APIRouter(prefix="/trackers", tags=["trackers"])


def _serialize_group(db: Session, group_id: int | None) -> schemas.Group | None:
    if group_id is None:
        return None

    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if group is None:
        return None

    memberships = (
        db.query(models.GroupMember, models.User)
        .join(models.User, models.User.id == models.GroupMember.user_id)
        .filter(models.GroupMember.group_id == group.id)
        .order_by(models.GroupMember.joined_at.asc())
        .all()
    )

    members = [
        schemas.GroupMember(
            user=schemas.User.model_validate(user),
            role=membership.role,
            joined_at=membership.joined_at,
        )
        for membership, user in memberships
    ]

    return schemas.Group(
        id=group.id,
        name=group.name,
        join_code=group.join_code,
        owner_id=group.owner_id,
        member_count=len(members),
        members=members,
    )


def _load_tracker_participants(db: Session, tracker_id: int) -> list[models.User]:
    participants = (
        db.query(models.User)
        .join(models.TrackerParticipant, models.TrackerParticipant.user_id == models.User.id)
        .filter(models.TrackerParticipant.tracker_id == tracker_id)
        .order_by(models.User.username.asc())
        .all()
    )
    return participants


def _load_tracker_activity_maps(db: Session, tracker_id: int):
    habit_logs = (
        db.query(models.HabitLog)
        .filter(models.HabitLog.tracker_id == tracker_id)
        .order_by(models.HabitLog.timestamp.asc())
        .all()
    )
    journal_entries = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.tracker_id == tracker_id)
        .order_by(models.JournalEntry.timestamp.asc())
        .all()
    )

    logs_by_user: dict[int, list[models.HabitLog]] = defaultdict(list)
    journals_by_user: dict[int, list[models.JournalEntry]] = defaultdict(list)

    for log in habit_logs:
        if log.user_id is not None:
            logs_by_user[int(log.user_id)].append(log)

    for journal in journal_entries:
        if journal.user_id is not None:
            journals_by_user[int(journal.user_id)].append(journal)

    return habit_logs, journal_entries, logs_by_user, journals_by_user


def _assign_tracker_participants(db: Session, tracker_id: int, participant_ids: list[int], owner_id: int):
    normalized_ids = sorted({int(participant_id) for participant_id in participant_ids if int(participant_id) > 0} | {owner_id})
    db.query(models.TrackerParticipant).filter(models.TrackerParticipant.tracker_id == tracker_id).delete(synchronize_session=False)
    db.flush()

    for participant_id in normalized_ids:
        db.add(
            models.TrackerParticipant(
                tracker_id=tracker_id,
                user_id=participant_id,
                role="owner" if participant_id == owner_id else "participant",
                added_at=utcnow(),
            )
        )


@router.get("/{tracker_id}/", response_model=schemas.Tracker)
def read_tracker(
    tracker_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracker = require_tracker_access(db, current_user.id, tracker_id)
    participant_count = db.query(models.TrackerParticipant).filter(models.TrackerParticipant.tracker_id == tracker_id).count()
    setattr(tracker, "participant_count", participant_count)
    return tracker


@router.get("/{tracker_id}/analytics", response_model=schemas.TrackerAnalytics)
def read_tracker_analytics(
    tracker_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracker = require_tracker_access(db, current_user.id, tracker_id)
    habit_logs, journal_entries, logs_by_user, journals_by_user = _load_tracker_activity_maps(db, tracker_id)
    participants = [current_user]

    if tracker.group_id is not None:
        participants = _load_tracker_participants(db, tracker_id)
        if not participants:
            participants = [current_user]

    return build_tracker_analytics(
        tracker,
        habit_logs,
        journal_entries,
        current_user_id=current_user.id,
        participants=participants,
        member_logs=dict(logs_by_user),
        member_journals=dict(journals_by_user),
    )


@router.get("/{tracker_id}/bundle", response_model=schemas.TrackerBundle)
def read_tracker_bundle(
    tracker_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracker = require_tracker_access(db, current_user.id, tracker_id)
    habit_logs, journal_entries, logs_by_user, journals_by_user = _load_tracker_activity_maps(db, tracker_id)
    participants = [current_user]

    if tracker.group_id is not None:
        participants = _load_tracker_participants(db, tracker_id)
        if not participants:
            participants = [current_user]

    analytics = build_tracker_analytics(
        tracker,
        habit_logs,
        journal_entries,
        current_user_id=current_user.id,
        participants=participants,
        member_logs=dict(logs_by_user),
        member_journals=dict(journals_by_user),
    )
    participant_count = db.query(models.TrackerParticipant).filter(models.TrackerParticipant.tracker_id == tracker_id).count()
    setattr(tracker, "participant_count", participant_count)

    return schemas.TrackerBundle(
        tracker=tracker,
        habit_logs=habit_logs,
        journal_entries=journal_entries,
        analytics=analytics,
        group=_serialize_group(db, tracker.group_id),
        share_stats=analytics.share_stats,
    )


@router.post("/{tracker_id}/reset", response_model=schemas.Tracker)
def reset_tracker(
    tracker_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracker = require_tracker_access(db, current_user.id, tracker_id)

    reset_at = utcnow()

    relapse_log = models.JournalEntry(
        tracker_id=tracker_id,
        user_id=current_user.id,
        content="Logged a relapse. Timer was reset to zero.",
        mood=1,
        is_relapse=True,
        timestamp=reset_at,
    )
    db.add(relapse_log)

    db.commit()
    db.refresh(tracker)
    setattr(tracker, "participant_count", db.query(models.TrackerParticipant).filter(models.TrackerParticipant.tracker_id == tracker_id).count())
    return tracker


@router.post("/", response_model=schemas.Tracker)
def create_tracker(
    tracker: schemas.TrackerCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payload = tracker.model_dump(exclude_none=True)
    group_id = payload.pop("group_id", None)
    participant_ids = payload.pop("participant_ids", [])

    if "start_date" in payload:
        payload["start_date"] = to_utc(payload["start_date"])
    else:
        payload["start_date"] = utcnow()

    payload["current_streak_start_date"] = payload["start_date"]
    payload["owner_id"] = current_user.id
    payload["group_id"] = group_id
    payload["visibility"] = "group" if group_id else "private"

    if group_id is not None:
        group = db.query(models.Group).filter(models.Group.id == int(group_id)).first()
        if group is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        if not can_view_group(db, current_user.id, group.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this group")
        if group.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the group owner can create shared trackers",
            )

        allowed_ids = {
            member.user_id
            for member in db.query(models.GroupMember).filter(models.GroupMember.group_id == group.id).all()
        }
        allowed_ids.add(current_user.id)
        normalized_ids = sorted({int(participant_id) for participant_id in participant_ids if int(participant_id) in allowed_ids})
        participant_ids = normalized_ids
    else:
        participant_ids = []

    db_tracker = models.Tracker(**payload)
    db.add(db_tracker)
    db.flush()
    _assign_tracker_participants(db, db_tracker.id, participant_ids, current_user.id)
    db.commit()
    db.refresh(db_tracker)
    setattr(db_tracker, "participant_count", db.query(models.TrackerParticipant).filter(models.TrackerParticipant.tracker_id == db_tracker.id).count())
    return db_tracker


@router.get("/", response_model=List[schemas.Tracker])
def read_trackers(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    trackers = db.query(models.Tracker).order_by(models.Tracker.id.desc()).all()
    accessible_trackers = [
        tracker
        for tracker in trackers
        if tracker.owner_id == current_user.id
        or db.query(models.TrackerParticipant)
        .filter(models.TrackerParticipant.tracker_id == tracker.id, models.TrackerParticipant.user_id == current_user.id)
        .first()
        is not None
    ]

    participant_counts = dict(
        db.query(models.TrackerParticipant.tracker_id, func.count(models.TrackerParticipant.id))
        .group_by(models.TrackerParticipant.tracker_id)
        .all()
    )
    for tracker in accessible_trackers:
        setattr(tracker, "participant_count", int(participant_counts.get(tracker.id, 0)))
    return accessible_trackers


@router.put("/{tracker_id}/stop", response_model=schemas.Tracker)
def stop_tracker(
    tracker_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracker = require_tracker_access(db, current_user.id, tracker_id, write=True)
    tracker.is_active = False
    db.commit()
    db.refresh(tracker)
    setattr(tracker, "participant_count", db.query(models.TrackerParticipant).filter(models.TrackerParticipant.tracker_id == tracker_id).count())
    return tracker


@router.put("/{tracker_id}/start", response_model=schemas.Tracker)
def start_tracker(
    tracker_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracker = require_tracker_access(db, current_user.id, tracker_id, write=True)
    tracker.is_active = True
    db.commit()
    db.refresh(tracker)
    setattr(tracker, "participant_count", db.query(models.TrackerParticipant).filter(models.TrackerParticipant.tracker_id == tracker_id).count())
    return tracker


@router.patch("/{tracker_id}/", response_model=schemas.Tracker)
def edit_tracker(
    tracker_id: int,
    entry: schemas.TrackerBase,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracker = require_tracker_access(db, current_user.id, tracker_id, write=True)

    payload = entry.model_dump(exclude_none=True)
    group_id = payload.pop("group_id", None)
    participant_ids = payload.pop("participant_ids", [])

    if group_id is not None:
        group = db.query(models.Group).filter(models.Group.id == int(group_id)).first()
        if group is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        if not can_view_group(db, current_user.id, group.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this group")
        if group.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the group owner can assign trackers to this group",
            )
        tracker.group_id = group.id
        tracker.visibility = "group"

        allowed_ids = {
            member.user_id
            for member in db.query(models.GroupMember).filter(models.GroupMember.group_id == group.id).all()
        }
        allowed_ids.add(current_user.id)
        participant_ids = [participant_id for participant_id in participant_ids if int(participant_id) in allowed_ids]
    else:
        tracker.group_id = None
        tracker.visibility = "private"
        participant_ids = []

    for field_name, field_value in payload.items():
        setattr(tracker, field_name, field_value)

    _assign_tracker_participants(db, tracker.id, participant_ids, current_user.id)
    db.commit()
    db.refresh(tracker)
    setattr(tracker, "participant_count", db.query(models.TrackerParticipant).filter(models.TrackerParticipant.tracker_id == tracker_id).count())
    return tracker


@router.delete("/{tracker_id}")
def delete_tracker(
    tracker_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracker = require_tracker_access(db, current_user.id, tracker_id, write=True)

    db.query(models.JournalEntry).filter(models.JournalEntry.tracker_id == tracker_id).delete(synchronize_session=False)
    db.query(models.HabitLog).filter(models.HabitLog.tracker_id == tracker_id).delete(synchronize_session=False)
    db.query(models.TrackerParticipant).filter(models.TrackerParticipant.tracker_id == tracker_id).delete(synchronize_session=False)
    db.delete(tracker)
    db.commit()

    return {"message": f"Tracker with ID {tracker_id} was deleted successfully"}