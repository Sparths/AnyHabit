from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..access import require_tracker_access
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/trackers/{tracker_id}/journal", tags=["journals"])


@router.post("/", response_model=schemas.JournalEntry)
def create_journal_entry(
    tracker_id: int,
    entry: schemas.JournalEntryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_tracker_access(db, current_user.id, tracker_id)

    db_entry = models.JournalEntry(**entry.model_dump(), tracker_id=tracker_id, user_id=current_user.id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.get("/", response_model=List[schemas.JournalEntry])
def read_journal_entries(tracker_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_tracker_access(db, current_user.id, tracker_id)
    return (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.tracker_id == tracker_id)
        .order_by(models.JournalEntry.timestamp.desc())
        .all()
    )


@router.put("/{journal_id}", response_model=schemas.JournalEntry)
def edit_journal_entry(
    tracker_id: int,
    journal_id: int,
    entry: schemas.JournalEntryBase,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_tracker_access(db, current_user.id, tracker_id)
    db_journal = db.query(models.JournalEntry).filter(
        models.JournalEntry.id == journal_id,
        models.JournalEntry.tracker_id == tracker_id,
    ).first()

    if db_journal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
    if db_journal.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own journal entries")

    db_journal.content = entry.content

    if entry.mood is not None:
        db_journal.mood = entry.mood

    db.commit()
    db.refresh(db_journal)

    return db_journal


@router.delete("/{journal_id}")
def delete_journal_entry(
    tracker_id: int,
    journal_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_tracker_access(db, current_user.id, tracker_id)
    db_journal = db.query(models.JournalEntry).filter(
        models.JournalEntry.id == journal_id,
        models.JournalEntry.tracker_id == tracker_id,
    ).first()
    if db_journal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracker or Journal not found")

    if db_journal.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own journal entries")

    db.delete(db_journal)
    db.commit()

    return {"message": f"Journal with ID {journal_id} was deleted successfully"}
