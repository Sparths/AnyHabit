from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class TrackerBase(BaseModel):
    name: str
    category: str = "General"
    type: str 
    impact_amount: float = 0.0
    impact_unit: str = "$"
    impact_per: str = "day" 
    unit: str
    units_per_amount: float = 0.0
    units_per: str = "day"
    units_per_interval: int = Field(default=1, ge=1)
    is_active: bool = True

class TrackerCreate(TrackerBase):
    start_date: Optional[datetime] = None

class Tracker(TrackerBase):
    id: int
    start_date: datetime
    current_streak_start_date: Optional[datetime] = None

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
    is_relapse: bool = False

    class Config:
        from_attributes = True


class HabitLogBase(BaseModel):
    amount: float = 1.0

class HabitLogCreate(HabitLogBase):
    pass

class HabitLog(HabitLogBase):
    id: int
    tracker_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class DailyStat(BaseModel):
    date: str
    total_amount: float

    class Config:
        from_attributes = True