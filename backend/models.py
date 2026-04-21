from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from datetime import datetime
from .database import Base

class Tracker(Base):
    __tablename__ = "trackers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, default="General", index=True)
    type = Column(String)
    start_date = Column(DateTime, default=datetime.utcnow)
    impact_amount = Column(Float, default=0.0)
    impact_unit = Column(String, default="$")
    impact_per = Column(String)
    unit = Column(String) 
    units_per_amount = Column(Float, default=0.0)
    units_per = Column(String)
    is_active = Column(Boolean, default=True)


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    tracker_id = Column(Integer, ForeignKey("trackers.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    mood = Column(Integer, nullable=True)
    content = Column(String)



class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tracker_id = Column(Integer, ForeignKey("trackers.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    amount = Column(Float, default=1.0)