import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..analytics import build_dashboard_summary
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


def _get_or_create_home_state(db: Session):
    state = db.query(models.DashboardState).filter(models.DashboardState.name == "home").first()
    if state:
        return state

    state = models.DashboardState(name="home", widgets_json="[]", layouts_json="{}")
    db.add(state)
    db.commit()
    db.refresh(state)
    return state


@router.get("/summary", response_model=schemas.DashboardSummary)
def read_dashboard_summary(db: Session = Depends(get_db)):
    trackers = db.query(models.Tracker).all()
    habit_logs = db.query(models.HabitLog).all()
    journal_entries = db.query(models.JournalEntry).all()

    return build_dashboard_summary(trackers, habit_logs, journal_entries)


@router.get("/home", response_model=schemas.DashboardStateResponse)
def read_home_dashboard(db: Session = Depends(get_db)):
    state = _get_or_create_home_state(db)

    return schemas.DashboardStateResponse(
        widgets=_parse_json_or_default(state.widgets_json, []),
        layouts=_parse_json_or_default(state.layouts_json, {}),
        updated_at=state.updated_at,
    )


@router.put("/home", response_model=schemas.DashboardStateResponse)
def update_home_dashboard(payload: schemas.DashboardStatePayload, db: Session = Depends(get_db)):
    state = _get_or_create_home_state(db)

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
