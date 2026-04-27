from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from datetime import datetime, timezone
from .database import Base


def utcnow_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Tracker(Base):
    __tablename__ = "trackers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, default="General", index=True)
    type = Column(String)
    start_date = Column(DateTime, default=utcnow_naive)
    current_streak_start_date = Column(DateTime, default=utcnow_naive)
    impact_amount = Column(Float, default=0.0)
    impact_unit = Column(String, default="$")
    impact_per = Column(String)
    unit = Column(String) 
    units_per_amount = Column(Float, default=0.0)
    units_per = Column(String)
    units_per_interval = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    tracker_id = Column(Integer, ForeignKey("trackers.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=utcnow_naive)
    mood = Column(Integer, nullable=True)
    content = Column(String)
    is_relapse = Column(Boolean, default=False)



class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tracker_id = Column(Integer, ForeignKey("trackers.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=utcnow_naive)
    amount = Column(Float, default=1.0)


class DashboardState(Base):
    __tablename__ = "dashboard_states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, default="home")
    widgets_json = Column(Text, default="[]")
    layouts_json = Column(Text, default="{}")
    updated_at = Column(DateTime, default=utcnow_naive, onupdate=utcnow_naive)