import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..analytics import build_dashboard_summary
from ..deps import get_current_user
from ..deps import get_db
from ..time_utils import utcnow_naive

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _parse_json_or_default(raw_value: str, default_value):
    if not raw_value:
        return default_value

    try:
        parsed = json.loads(raw_value)
    except json.JSONDecodeError:
        return default_value

    if isinstance(default_value, list) and isinstance(parsed, list):
        return parsed
    if isinstance(default_value, dict) and isinstance(parsed, dict):
        return parsed
    return default_value


def _get_or_create_home_state(db: Session, user_id: int):
    state = (
        db.query(models.UserDashboardState)
        .filter(models.UserDashboardState.user_id == user_id, models.UserDashboardState.name == "home")
        .first()
    )
    if state:
        return state

    state = models.UserDashboardState(user_id=user_id, name="home", widgets_json="[]", layouts_json="{}")
    db.add(state)
    db.commit()
    db.refresh(state)
    return state


def _get_accessible_trackers(db: Session, current_user_id: int):
    trackers = db.query(models.Tracker).all()
    return [
        tracker
        for tracker in trackers
        if tracker.owner_id == current_user_id
        or db.query(models.TrackerParticipant)
        .filter(models.TrackerParticipant.tracker_id == tracker.id, models.TrackerParticipant.user_id == current_user_id)
        .first()
        is not None
    ]


@router.get("/summary", response_model=schemas.DashboardSummary)
def read_dashboard_summary(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    trackers = _get_accessible_trackers(db, current_user.id)
    tracker_ids = {tracker.id for tracker in trackers}
    habit_logs = (
        db.query(models.HabitLog)
        .filter(models.HabitLog.tracker_id.in_(tracker_ids), models.HabitLog.user_id == current_user.id)
        .all()
        if tracker_ids
        else []
    )
    journal_entries = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.tracker_id.in_(tracker_ids), models.JournalEntry.user_id == current_user.id)
        .all()
        if tracker_ids
        else []
    )

    return build_dashboard_summary(trackers, habit_logs, journal_entries)


@router.get("/home", response_model=schemas.DashboardStateResponse)
def read_home_dashboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    state = _get_or_create_home_state(db, current_user.id)

    return schemas.DashboardStateResponse(
        widgets=_parse_json_or_default(state.widgets_json, []),
        layouts=_parse_json_or_default(state.layouts_json, {}),
        updated_at=state.updated_at,
    )


@router.put("/home", response_model=schemas.DashboardStateResponse)
def update_home_dashboard(
    payload: schemas.DashboardStatePayload,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    state = _get_or_create_home_state(db, current_user.id)

    state.widgets_json = json.dumps(payload.widgets, separators=(",", ":"), ensure_ascii=True)
    state.layouts_json = json.dumps(payload.layouts, separators=(",", ":"), ensure_ascii=True)
    state.updated_at = utcnow_naive()

    db.commit()
    db.refresh(state)

    return schemas.DashboardStateResponse(
        widgets=payload.widgets,
        layouts=payload.layouts,
        updated_at=state.updated_at,
    )
