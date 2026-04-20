from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SessionLocal
from typing import List

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AnyHabit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to AnyHabit! The Server is running."}


#Tracker


#Create
@app.post("/trackers/", response_model=schemas.Tracker)
def create_tracker(tracker: schemas.TrackerCreate, db: Session = Depends(get_db)):
    db_tracker = models.Tracker(**tracker.model_dump())
    db.add(db_tracker)
    db.commit()
    db.refresh(db_tracker)
    return db_tracker


#Read
@app.get("/trackers/", response_model=List[schemas.Tracker])
def read_trackers(db: Session = Depends(get_db)):
    return db.query(models.Tracker).all()

#Stop
@app.put("/trackers/{tracker_id}/stop", response_model=schemas.Tracker)
def stop_tracker(tracker_id: int, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if (db_tracker is None):
        raise HTTPException(status_code=404, detail="Tracker not found")

    db_tracker.is_active = False
    db.commit()
    db.refresh(db_tracker)
    return db_tracker

#Start
@app.put("/trackers/{tracker_id}/start", response_model=schemas.Tracker)
def start_tracker(tracker_id: int, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if (db_tracker is None):
        raise HTTPException(status_code=404, detail="Tracker not found")
    
    db_tracker.is_active = True
    db.commit()
    db.refresh(db_tracker)
    return db_tracker


#edit
@app.patch("/trackers/{tracker_id}/", response_model=schemas.Tracker)
def edit_tracker(tracker_id: int, entry: schemas.TrackerBase, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()

    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")

    db_tracker.name = entry.name
    db_tracker.type = entry.type
    db_tracker.money_saved_amount = entry.money_saved_amount
    db_tracker.money_saved_per = entry.money_saved_per
    db_tracker.unit = entry.unit
    db_tracker.units_per_amount = entry.units_per_amount
    db_tracker.units_per = entry.units_per
    db_tracker.is_active = entry.is_active

    db.commit()
    db.refresh(db_tracker)

    return db_tracker


#Delete
@app.delete("/trackers/{tracker_id}")
def delete_tracker(tracker_id: int, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")
    

    db.query(models.JournalEntry).filter(models.JournalEntry.tracker_id == tracker_id).delete()
    db.delete(db_tracker)
    db.commit()
    
    return {"message": f"Tracker with ID {tracker_id} was deleted successfully"}



#Journal

#Create
@app.post("/trackers/{tracker_id}/journal/", response_model=schemas.JournalEntry)
def create_journal_entry(tracker_id: int, entry: schemas.JournalEntryCreate, db: Session = Depends(get_db)):
    db_tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if db_tracker is None:
        raise HTTPException(status_code=404, detail="Tracker not found")

    db_entry = models.JournalEntry(**entry.model_dump(), tracker_id=tracker_id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


#Read
@app.get("/trackers/{tracker_id}/journal/", response_model=List[schemas.JournalEntry])
def read_journal_entries(tracker_id: int, db: Session = Depends(get_db)):
    entries = db.query(models.JournalEntry).filter(models.JournalEntry.tracker_id == tracker_id).all()
    return entries

# Edit
@app.put("/trackers/{tracker_id}/journal/{journal_id}", response_model=schemas.JournalEntry)
def edit_journal_entry(tracker_id: int, journal_id: int, entry: schemas.JournalEntryBase,db: Session = Depends(get_db)):
    db_journal = db.query(models.JournalEntry).filter(
        models.JournalEntry.id == journal_id,
        models.JournalEntry.tracker_id == tracker_id
    ).first()

    if db_journal is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    db_journal.content = entry.content

    if entry.mood is not None:
        db_journal.mood = entry.mood

    db.commit()
    db.refresh(db_journal)

    return db_journal

    


#Delete
@app.delete("/trackers/{tracker_id}/journal/{journal_id}")
def delete_journal_entry(tracker_id: int, journal_id: int, db: Session = Depends(get_db)):
    db_journal = db.query(models.JournalEntry).filter(models.JournalEntry.id == journal_id, models.JournalEntry.tracker_id == tracker_id).first()
    if db_journal is None:
        raise HTTPException(status_code=404, detail="Tracker or Journal not found")
    
    db.delete(db_journal)
    db.commit()
    
    return {"message": f"Journal with ID {journal_id} was deleted successfully"}


@app.post("/trackers/{tracker_id}/logs/", response_model=schemas.HabitLog)
def create_log(tracker_id: int, log: schemas.HabitLogCreate, db: Session = Depends(get_db)):
    tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker not found")
    
    db_log = models.HabitLog(**log.model_dump(), tracker_id=tracker_id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/trackers/{tracker_id}/logs/", response_model=list[schemas.HabitLog])
def read_logs(tracker_id: int, db: Session = Depends(get_db)):
    logs = db.query(models.HabitLog).filter(models.HabitLog.tracker_id == tracker_id).all()
    return logs

@app.delete("/trackers/{tracker_id}/logs/{log_id}")
def delete_log(tracker_id: int, log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.HabitLog).filter(models.HabitLog.id == log_id, models.HabitLog.tracker_id == tracker_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(log)
    db.commit()
    return {"message": "Log deleted"}