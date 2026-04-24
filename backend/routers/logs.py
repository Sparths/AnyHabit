from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db
from ..time_utils import to_utc_naive

router = APIRouter(prefix="/trackers/{tracker_id}/logs", tags=["logs"])


@router.post("/", response_model=schemas.HabitLog)
def create_log(
    tracker_id: int,
    timestamp: datetime,
    log: schemas.HabitLogCreate,
    db: Session = Depends(get_db),
):
    tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker not found")

    db_log = models.HabitLog(**log.model_dump(), tracker_id=tracker_id, timestamp=to_utc_naive(timestamp))
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/", response_model=list[schemas.HabitLog])
def read_logs(tracker_id: int, db: Session = Depends(get_db)):
    return db.query(models.HabitLog).filter(models.HabitLog.tracker_id == tracker_id).all()


@router.delete("/{log_id}")
def delete_log(tracker_id: int, log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.HabitLog).filter(
        models.HabitLog.id == log_id,
        models.HabitLog.tracker_id == tracker_id,
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    db.delete(log)
    db.commit()
    return {"message": "Log deleted"}
