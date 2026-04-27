from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Optional


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


class TrackerCurrentMath(BaseModel):
    main_unit: float = 0.0
    target_unit: float = 0.0
    impact_value: float = 0.0


class TrackerDailyProgress(BaseModel):
    total: float = 0.0
    target: float = 0.0
    percentage: float = 0.0


class TrackerStreakStats(BaseModel):
    current: int = 0
    longest: int = 0
    period_label: str = "days"


class TrackerChartPoint(BaseModel):
    date: str
    label: str
    value: float
    cumulative: Optional[float] = None


class TrackerHeatmapCell(BaseModel):
    date: str
    amount: float
    is_filler: bool = False


class TrackerHeatmap(BaseModel):
    columns: list[list[TrackerHeatmapCell]]
    max_amount: float = 0.0


class TrackerAnalytics(BaseModel):
    current_math: TrackerCurrentMath
    daily_progress: TrackerDailyProgress
    historical_chart_data: list[TrackerChartPoint]
    streak_stats: TrackerStreakStats
    build_heatmap: Optional[TrackerHeatmap] = None


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


class TrackerBundle(BaseModel):
    tracker: Tracker
    habit_logs: list[HabitLog]
    journal_entries: list[JournalEntry]
    analytics: TrackerAnalytics


class DashboardOverview(BaseModel):
    total: int = 0
    active: int = 0
    paused: int = 0
    categories: int = 0
    by_type: dict[str, int] = Field(default_factory=dict)


class DashboardCategoryStat(BaseModel):
    category: str
    count: int = 0


class DashboardImpactRow(BaseModel):
    tracker: Tracker
    main_amount: float = 0.0
    impact_value: float = 0.0
    month_impact: float = 0.0
    mode_label: str = ""


class DashboardSummary(BaseModel):
    overview: DashboardOverview
    category_breakdown: list[DashboardCategoryStat]
    impact_rows: list[DashboardImpactRow]
    top_impact_rows: list[DashboardImpactRow]

class DailyStat(BaseModel):
    date: str
    total_amount: float

    class Config:
        from_attributes = True


class DashboardStatePayload(BaseModel):
    widgets: list[dict[str, Any]] = Field(default_factory=list)
    layouts: dict[str, Any] = Field(default_factory=dict)


class DashboardStateResponse(DashboardStatePayload):
    updated_at: Optional[datetime] = None