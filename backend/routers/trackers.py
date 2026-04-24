from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db
from ..time_utils import to_utc_naive, utcnow_naive

router = APIRouter(prefix="/trackers", tags=["trackers"])


@router.post("/{tracker_id}/reset", response_model=schemas.Tracker)
def reset_tracker(tracker_id: int, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")

    reset_at = utcnow_naive()
    db_tracker.current_streak_start_date = reset_at

    relapse_log = models.JournalEntry(
        tracker_id=tracker_id,
        content="Logged a relapse. Timer was reset to zero.",
        mood=1,
        is_relapse=True,
        timestamp=reset_at,
    )
    db.add(relapse_log)

    db.commit()
    db.refresh(db_tracker)
    return db_tracker


@router.post("/", response_model=schemas.Tracker)
def create_tracker(tracker: schemas.TrackerCreate, db: Session = Depends(get_db)):
    payload = tracker.model_dump(exclude_none=True)
    if "start_date" in payload:
        payload["start_date"] = to_utc_naive(payload["start_date"])
    else:
        payload["start_date"] = utcnow_naive()

    payload["current_streak_start_date"] = payload["start_date"]

    db_tracker = models.Tracker(**payload)
    db.add(db_tracker)
    db.commit()
    db.refresh(db_tracker)
    return db_tracker


@router.get("/", response_model=List[schemas.Tracker])
def read_trackers(db: Session = Depends(get_db)):
    return db.query(models.Tracker).all()


@router.put("/{tracker_id}/stop", response_model=schemas.Tracker)
def stop_tracker(tracker_id: int, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")

    db_tracker.is_active = False
    db.commit()
    db.refresh(db_tracker)
    return db_tracker


@router.put("/{tracker_id}/start", response_model=schemas.Tracker)
def start_tracker(tracker_id: int, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")

    db_tracker.is_active = True
    db.commit()
    db.refresh(db_tracker)
    return db_tracker


@router.patch("/{tracker_id}/", response_model=schemas.Tracker)
def edit_tracker(tracker_id: int, entry: schemas.TrackerBase, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()

    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")

    db_tracker.name = entry.name
    db_tracker.category = entry.category
    db_tracker.type = entry.type
    db_tracker.impact_amount = entry.impact_amount
    db_tracker.impact_unit = entry.impact_unit
    db_tracker.impact_per = entry.impact_per
    db_tracker.unit = entry.unit
    db_tracker.units_per_amount = entry.units_per_amount
    db_tracker.units_per = entry.units_per
    db_tracker.is_active = entry.is_active

    db.commit()
    db.refresh(db_tracker)

    return db_tracker


@router.delete("/{tracker_id}")
def delete_tracker(tracker_id: int, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")

    db.query(models.JournalEntry).filter(models.JournalEntry.tracker_id == tracker_id).delete()
    db.query(models.HabitLog).filter(models.HabitLog.tracker_id == tracker_id).delete()
    db.delete(db_tracker)
    db.commit()

    return {"message": f"Tracker with ID {tracker_id} was deleted successfully"}
