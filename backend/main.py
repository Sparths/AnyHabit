from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from .database import engine, SessionLocal
from typing import List

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AnyHabit API")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to AnyHabit! The Server is running."}


@app.post("/trackers/", response_model=schemas.Tracker)
def create_tracker(tracker: schemas.TrackerCreate, db: Session = Depends(get_db)):
    db_tracker = models.Tracker(**tracker.model_dump())
    db.add(db_tracker)
    db.commit()
    db.refresh(db_tracker)
    return db_tracker
    
@app.get("/trackers/", response_model=List[schemas.Tracker])
def read_trackers(db: Session = Depends(get_db)):
    return db.query(models.Tracker).all()

@app.put("/trackers/{tracker_id}/stop", response_model=schemas.Tracker)
def stop_tracker(tracker_id: int, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id)
    if (db_tracker is None):
        raise HTTPException(status_code=404, detail="Tracker not found")

    db_tracker.is_active = False
    db.commit()
    db.refresh(db_tracker)
    return db_tracker

@app.post("/trackers/{tracker_id}/journal/", response_model=schemas.JournalEntry)
def create_journal_entry(tracker_id: int, entry: schemas.JournalEntryCreate, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id)
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")

    db_entry = models.JournalEntry(**entry.model_dump(), tracker_id=tracker_id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/trackers/{tracker_id}/journal/", response_model=List[schemas.JournalEntry])
def read_journal_entries(tracker_id: int, db: Session = Depends(get_db)):
    entries = db.query(models.JournalEntry).filter(models.JournalEntry.tracker_id == tracker_id).all()
    return entries