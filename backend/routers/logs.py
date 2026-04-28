from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..access import require_tracker_access
from ..deps import get_current_user, get_db
from ..time_utils import to_utc_naive

router = APIRouter(prefix="/trackers/{tracker_id}/logs", tags=["logs"])


@router.post("/", response_model=schemas.HabitLog)
def create_log(
    tracker_id: int,
    timestamp: datetime,
    log: schemas.HabitLogCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_tracker_access(db, current_user.id, tracker_id)

    db_log = models.HabitLog(
        **log.model_dump(),
        tracker_id=tracker_id,
        user_id=current_user.id,
        timestamp=to_utc_naive(timestamp),
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/", response_model=list[schemas.HabitLog])
def read_logs(tracker_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_tracker_access(db, current_user.id, tracker_id)
    return (
        db.query(models.HabitLog)
        .filter(models.HabitLog.tracker_id == tracker_id)
        .order_by(models.HabitLog.timestamp.desc())
        .all()
    )


@router.delete("/{log_id}")
def delete_log(
    tracker_id: int,
    log_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracker = require_tracker_access(db, current_user.id, tracker_id)
    log = db.query(models.HabitLog).filter(
        models.HabitLog.id == log_id,
        models.HabitLog.tracker_id == tracker_id,
    ).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")

    if tracker.owner_id != current_user.id and log.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own logs")

    db.delete(log)
    db.commit()
    return {"message": "Log deleted"}
