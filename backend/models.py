from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, UniqueConstraint
from .database import Base
from .time_utils import utcnow

class Tracker(Base):
    __tablename__ = "trackers"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String, index=True)
    category = Column(String, default="General", index=True)
    type = Column(String)
    start_date = Column(DateTime(timezone=True), default=utcnow)
    current_streak_start_date = Column(DateTime(timezone=True), default=utcnow)
    impact_amount = Column(Float, default=0.0)
    impact_unit = Column(String, default="$")
    impact_per = Column(String)
    unit = Column(String) 
    units_per_amount = Column(Float, default=0.0)
    units_per = Column(String)
    units_per_interval = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    visibility = Column(String, default="private", index=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    is_active = Column(Boolean, default=True)


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    join_code = Column(String, unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class GroupMember(Base):
    __tablename__ = "group_members"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_group_members_group_user"),)

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role = Column(String, default="member")
    joined_at = Column(DateTime(timezone=True), default=utcnow)


class TrackerParticipant(Base):
    __tablename__ = "tracker_participants"
    __table_args__ = (UniqueConstraint("tracker_id", "user_id", name="uq_tracker_participants_tracker_user"),)

    id = Column(Integer, primary_key=True, index=True)
    tracker_id = Column(Integer, ForeignKey("trackers.id", ondelete="CASCADE"), index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role = Column(String, default="participant")
    added_at = Column(DateTime(timezone=True), default=utcnow)


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    tracker_id = Column(Integer, ForeignKey("trackers.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow)
    mood = Column(Integer, nullable=True)
    content = Column(String)
    is_relapse = Column(Boolean, default=False)



class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tracker_id = Column(Integer, ForeignKey("trackers.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow)
    amount = Column(Float, default=1.0)


class UserDashboardState(Base):
    __tablename__ = "user_dashboard_states"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_user_dashboard_state_name"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name = Column(String, index=True, default="home")
    widgets_json = Column(Text, default="[]")
    layouts_json = Column(Text, default="{}")
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)