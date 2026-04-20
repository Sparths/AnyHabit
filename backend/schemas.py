from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TrackerBase(BaseModel):
    name: str
    type: str 
    money_saved_amount: float = 0.0
    money_saved_per: str = "day" 
    unit: str
    units_per_amount: float = 0.0
    units_per: str = "day"
    is_active: bool = True

class TrackerCreate(TrackerBase):
    start_date: Optional[datetime] = None

class Tracker(TrackerBase):
    id: int
    start_date: datetime

    class Config:
        from_attributes = True


class JournalEntryBase(BaseModel):
    mood: Optional[int] = None
    content: str

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntry(JournalEntryBase):
    id: int
    tracker_id: int
    timestamp: datetime

    class Config:
        from_attributes = True