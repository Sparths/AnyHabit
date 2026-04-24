from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db

router = APIRouter(prefix="/trackers/{tracker_id}/journal", tags=["journals"])


@router.post("/", response_model=schemas.JournalEntry)
def create_journal_entry(tracker_id: int, entry: schemas.JournalEntryCreate, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")

    db_entry = models.JournalEntry(**entry.model_dump(), tracker_id=tracker_id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.get("/", response_model=List[schemas.JournalEntry])
def read_journal_entries(tracker_id: int, db: Session = Depends(get_db)):
    return db.query(models.JournalEntry).filter(models.JournalEntry.tracker_id == tracker_id).all()


@router.put("/{journal_id}", response_model=schemas.JournalEntry)
def edit_journal_entry(
    tracker_id: int,
    journal_id: int,
    entry: schemas.JournalEntryBase,
    db: Session = Depends(get_db),
):
    db_journal = db.query(models.JournalEntry).filter(
        models.JournalEntry.id == journal_id,
        models.JournalEntry.tracker_id == tracker_id,
    ).first()

    if db_journal is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    db_journal.content = entry.content

    if entry.mood is not None:
        db_journal.mood = entry.mood

    db.commit()
    db.refresh(db_journal)

    return db_journal


@router.delete("/{journal_id}")
def delete_journal_entry(tracker_id: int, journal_id: int, db: Session = Depends(get_db)):
    db_journal = db.query(models.JournalEntry).filter(
        models.JournalEntry.id == journal_id,
        models.JournalEntry.tracker_id == tracker_id,
    ).first()
    if db_journal is None:
        raise HTTPException(status_code=404, detail="Tracker or Journal not found")

    db.delete(db_journal)
    db.commit()

    return {"message": f"Journal with ID {journal_id} was deleted successfully"}
