import pytest
from datetime import datetime, timedelta
from types import SimpleNamespace

from backend.analytics import (
    period_start,
    add_period,
    shift_period,
    get_periods_between,
    get_window_details,
    get_period_label,
    _days_in_month,
    build_tracker_analytics,
)
from backend.models import Tracker, HabitLog, JournalEntry


class TestDateUtilities:
    """Test date manipulation functions."""

    def test_period_start_day(self):
        """Test period_start returns start of day."""
        date = datetime(2024, 3, 15, 14, 30, 45)
        result = period_start(date, "day")
        assert result.hour == 0
        assert result.minute == 0
        assert result.second == 0
        assert result.day == 15

    def test_period_start_week(self):
        """Test period_start returns start of week (Sunday)."""
        # March 13, 2024 is a Wednesday
        date = datetime(2024, 3, 15, 14, 30, 45)
        result = period_start(date, "week")
        # Should go back to Sunday (March 10)
        assert result.day == 10
        assert result.weekday() == 6  # Sunday

    def test_period_start_month(self):
        """Test period_start returns first day of month."""
        date = datetime(2024, 3, 15, 14, 30, 45)
        result = period_start(date, "month")
        assert result.day == 1
        assert result.month == 3

    def test_period_start_year(self):
        """Test period_start returns first day of year."""
        date = datetime(2024, 6, 15, 14, 30, 45)
        result = period_start(date, "year")
        assert result.day == 1
        assert result.month == 1
        assert result.year == 2024

    def test_add_period_day(self):
        """Test add_period adds one day."""
        date = datetime(2024, 3, 15, 10, 30)
        result = add_period(date, "day")
        assert result.day == 16
        assert result.month == 3

    def test_add_period_week(self):
        """Test add_period adds one week."""
        date = datetime(2024, 3, 15, 10, 30)
        result = add_period(date, "week")
        assert (result - date).days == 7

    def test_add_period_month(self):
        """Test add_period adds one month."""
        date = datetime(2024, 2, 15, 10, 30)
        result = add_period(date, "month")
        assert result.month == 3
        assert result.day == 15

    def test_add_period_month_edge_case_feb_31(self):
        """Test add_period handles Feb 31 edge case."""
        date = datetime(2024, 1, 31, 10, 30)
        result = add_period(date, "month")
        assert result.month == 2
        assert result.day == 29  # Feb has 29 days in 2024 (leap year)

    def test_add_period_year(self):
        """Test add_period adds one year."""
        date = datetime(2024, 6, 15, 10, 30)
        result = add_period(date, "year")
        assert result.year == 2025
        assert result.month == 6
        assert result.day == 15

    def test_shift_period_multiple_months(self):
        """Test shift_period shifts multiple months."""
        date = datetime(2024, 1, 31, 10, 30)
        result = shift_period(date, "month", 3)
        assert result.month == 4
        assert result.year == 2024
        assert result.day == 30  # April has 30 days

    def test_shift_period_backward(self):
        """Test shift_period shifts backward."""
        date = datetime(2024, 3, 15, 10, 30)
        result = shift_period(date, "month", -1)
        assert result.month == 2
        assert result.day == 15

    def test_shift_period_zero(self):
        """Test shift_period with zero returns same date."""
        date = datetime(2024, 3, 15, 10, 30)
        result = shift_period(date, "month", 0)
        assert result == date

    def test_get_periods_between_days(self):
        """Test get_periods_between for days."""
        start = datetime(2024, 3, 10, 10, 30)
        end = datetime(2024, 3, 15, 10, 30)
        result = get_periods_between(start, end, "day")
        assert result == 5

    def test_get_periods_between_months(self):
        """Test get_periods_between for months."""
        start = datetime(2024, 1, 15, 10, 30)
        end = datetime(2024, 6, 15, 10, 30)
        result = get_periods_between(start, end, "month")
        assert result == 5

    def test_get_window_details(self):
        """Test get_window_details returns correct window."""
        anchor = datetime(2024, 3, 1, 10, 30)  # Start of March
        date = datetime(2024, 3, 15, 10, 30)
        result = get_window_details(date, anchor, "week", interval_count=1)

        assert "window_index" in result
        assert "start" in result
        assert "end" in result
        assert result["start"] <= date < result["end"]

    def test_days_in_month(self):
        """Test _days_in_month calculation."""
        assert _days_in_month(2024, 1) == 31
        assert _days_in_month(2024, 2) == 29  # Leap year
        assert _days_in_month(2023, 2) == 28  # Non-leap year
        assert _days_in_month(2024, 4) == 30
        assert _days_in_month(2024, 12) == 31

    def test_get_period_label_singular(self):
        """Test get_period_label for single intervals."""
        result = get_period_label("day", 1)
        assert result == "days"

        result = get_period_label("week", 1)
        assert result == "weeks"

    def test_get_period_label_multiple(self):
        """Test get_period_label for multiple intervals."""
        result = get_period_label("day", 3)
        assert result == "3-day windows"

        result = get_period_label("week", 2)
        assert result == "2-week windows"


class TestTrackerAnalytics:
    """Test tracker analytics calculation."""

    def test_build_tracker_analytics_quit_type(self):
        """Test analytics for quit type tracker."""
        now = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tracker = Tracker(
            id=1,
            name="Quit Smoking",
            type="quit",
            start_date=now - timedelta(days=10),
            current_streak_start_date=now - timedelta(days=10),
            impact_amount=10.0,
            impact_per="month",
            unit="days",
            units_per_amount=1,
            units_per="day",
            units_per_interval=1,
        )
        logs = []
        journals = []

        analytics = build_tracker_analytics(tracker, logs, journals)

        assert analytics is not None
        assert analytics.current_math is not None
        assert analytics.current_math.main_unit >= 0
        assert analytics.current_math.impact_value >= 0

    def test_build_tracker_analytics_build_type(self, simple_namespace_tracker):
        """Test analytics for build type tracker."""
        logs = [
            SimpleNamespace(
                timestamp=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i),
                amount=2.0
            )
            for i in range(3)
        ]
        journals = []

        analytics = build_tracker_analytics(simple_namespace_tracker, logs, journals)

        assert analytics is not None
        assert analytics.current_math is not None
        assert analytics.current_math.main_unit == 6.0  # 3 logs * 2.0 amount
        assert analytics.daily_progress is not None

    def test_build_tracker_analytics_with_journals(self):
        """Test analytics includes journal data."""
        now = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tracker = SimpleNamespace(
            id=1,
            name="Test",
            type="build",
            start_date=now - timedelta(days=10),
            current_streak_start_date=now - timedelta(days=10),
            impact_amount=5.0,
            impact_per="day",
            unit="pages",
            units_per_amount=2,
            units_per="day",
            units_per_interval=1,
        )
        logs = [
            SimpleNamespace(timestamp=now, amount=2.0),
        ]
        journals = [
            SimpleNamespace(
                timestamp=now,
                mood=7,
                content="Great day!",
                is_relapse=False,
                tracker_id=1
            ),
        ]

        analytics = build_tracker_analytics(tracker, logs, journals)

        assert analytics is not None
        assert analytics.historical_chart_data is not None
        assert len(analytics.historical_chart_data) > 0

    def test_build_tracker_analytics_heatmap(self):
        """Test analytics builds heatmap."""
        now = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tracker = SimpleNamespace(
            id=1,
            name="Test",
            type="build",
            start_date=now - timedelta(days=200),
            current_streak_start_date=now - timedelta(days=200),
            impact_amount=5.0,
            impact_per="day",
            unit="pages",
            units_per_amount=2,
            units_per="day",
            units_per_interval=1,
        )
        logs = [
            SimpleNamespace(
                timestamp=now - timedelta(days=i),
                amount=2.0
            )
            for i in range(50)
        ]
        journals = []

        analytics = build_tracker_analytics(tracker, logs, journals)

        assert analytics.build_heatmap is not None
        assert hasattr(analytics.build_heatmap, "columns")
        assert hasattr(analytics.build_heatmap, "max_amount")
        assert len(analytics.build_heatmap.columns) > 0

    def test_build_tracker_analytics_streak_stats(self):
        """Test streak statistics calculation."""
        now = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tracker = SimpleNamespace(
            id=1,
            name="Test",
            type="build",
            start_date=now - timedelta(days=30),
            current_streak_start_date=now - timedelta(days=5),
            impact_amount=5.0,
            impact_per="day",
            unit="pages",
            units_per_amount=1,
            units_per="day",
            units_per_interval=1,
        )
        # Logs for last 5 days (current streak)
        logs = [
            SimpleNamespace(
                timestamp=now - timedelta(days=i),
                amount=1.0
            )
            for i in range(5)
        ]
        journals = []

        analytics = build_tracker_analytics(tracker, logs, journals)

        assert analytics.streak_stats is not None
        assert analytics.streak_stats.current >= 0
        assert analytics.streak_stats.longest >= 0


class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_tracker_with_none_values(self):
        """Test tracker analytics handles None values gracefully."""
        tracker = SimpleNamespace(
            id=1,
            name="Test",
            type="build",
            start_date=None,
            current_streak_start_date=None,
            impact_amount=None,
            impact_per="day",
            unit="pages",
            units_per_amount=None,
            units_per="day",
            units_per_interval=None,
        )
        logs = []
        journals = []

        # Should not raise exception
        analytics = build_tracker_analytics(tracker, logs, journals)
        assert analytics is not None

    def test_tracker_with_empty_logs(self):
        """Test tracker analytics works with no logs."""
        now = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tracker = SimpleNamespace(
            id=1,
            name="Test",
            type="build",
            start_date=now - timedelta(days=10),
            current_streak_start_date=now - timedelta(days=10),
            impact_amount=5.0,
            impact_per="day",
            unit="pages",
            units_per_amount=2,
            units_per="day",
            units_per_interval=1,
        )
        logs = []
        journals = []

        analytics = build_tracker_analytics(tracker, logs, journals)
        assert analytics.current_math.main_unit == 0.0

    def test_tracker_with_zero_units_per_amount(self):
        """Test tracker with zero units_per_amount."""
        now = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tracker = SimpleNamespace(
            id=1,
            name="Test",
            type="build",
            start_date=now - timedelta(days=10),
            current_streak_start_date=now - timedelta(days=10),
            impact_amount=5.0,
            impact_per="day",
            unit="pages",
            units_per_amount=0,
            units_per="day",
            units_per_interval=1,
        )
        logs = []
        journals = []

        analytics = build_tracker_analytics(tracker, logs, journals)
        assert analytics is not None
        assert analytics.current_math.target_unit == 0.0
