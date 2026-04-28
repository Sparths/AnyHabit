from __future__ import annotations

from datetime import datetime, timedelta

from . import models, schemas

DAY_MS = 1000 * 60 * 60 * 24


def get_interval_count(tracker: models.Tracker) -> int:
    return max(1, int(tracker.units_per_interval or 1))


def to_utc_date_key(date: datetime) -> str:
    return date.strftime("%Y-%m-%d")


def format_short_date(date: datetime) -> str:
    return date.strftime("%b %-d")


def _days_in_month(year: int, month: int) -> int:
    next_month = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)
    this_month = datetime(year, month, 1)
    return (next_month - this_month).days


def period_start(date: datetime, period: str) -> datetime:
    normalized = date.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "week":
        weekday = (normalized.weekday() + 1) % 7
        return normalized - timedelta(days=weekday)
    if period == "month":
        return normalized.replace(day=1)
    if period == "year":
        return normalized.replace(month=1, day=1)
    return normalized


def add_period(date: datetime, period: str) -> datetime:
    if period == "week":
        return date + timedelta(days=7)
    if period == "month":
        year = date.year + (date.month // 12)
        month = 1 if date.month == 12 else date.month + 1
        day = min(date.day, _days_in_month(year, month))
        return date.replace(year=year, month=month, day=day)
    if period == "year":
        year = date.year + 1
        day = min(date.day, _days_in_month(year, date.month))
        return date.replace(year=year, day=day)
    return date + timedelta(days=1)


def shift_period(date: datetime, period: str, amount: int) -> datetime:
    if amount == 0:
        return date
    if period == "week":
        return date + timedelta(days=7 * amount)
    if period == "month":
        total_months = date.year * 12 + (date.month - 1) + amount
        year, month_index = divmod(total_months, 12)
        month = month_index + 1
        day = min(date.day, _days_in_month(year, month))
        return date.replace(year=year, month=month, day=day)
    if period == "year":
        year = date.year + amount
        day = min(date.day, _days_in_month(year, date.month))
        return date.replace(year=year, day=day)
    return date + timedelta(days=amount)


def get_periods_between(start_date: datetime, end_date: datetime, period: str) -> int:
    start = period_start(start_date, period)
    end = period_start(end_date, period)

    if period == "day":
        return (end - start).days
    if period == "week":
        return (end - start).days // 7
    if period == "month":
        return (end.year - start.year) * 12 + (end.month - start.month)
    return end.year - start.year


def get_window_details(
    date: datetime,
    anchor: datetime,
    period: str,
    interval_count: int,
) -> dict[str, datetime | int]:
    base_date = period_start(date, period)
    diff_periods = get_periods_between(anchor, base_date, period)
    window_index = diff_periods // interval_count
    start = shift_period(anchor, period, window_index * interval_count)
    end = shift_period(start, period, interval_count)
    return {"window_index": window_index, "start": start, "end": end}


def get_period_label(period: str, interval_count: int) -> str:
    labels = {
        "day": {"singular": "day", "plural": "days"},
        "week": {"singular": "week", "plural": "weeks"},
        "month": {"singular": "month", "plural": "months"},
        "year": {"singular": "year", "plural": "years"},
    }

    if interval_count == 1:
        return labels.get(period, labels["day"])["plural"]
    return f"{interval_count}-{labels.get(period, labels['day'])['singular']} windows"


def _get_ms_per_period(period: str) -> float:
    ms_per_day = float(DAY_MS)
    if period == "week":
        return ms_per_day * 7
    if period == "month":
        return ms_per_day * 30.44
    if period == "year":
        return ms_per_day * 365.25
    return ms_per_day


def _build_daily_log_map(habit_logs: list[models.HabitLog]) -> dict[str, float]:
    totals: dict[str, float] = {}
    for log in habit_logs:
        key = to_utc_date_key(period_start(log.timestamp, "day"))
        totals[key] = totals.get(key, 0.0) + float(log.amount or 0)
    return totals


def _build_relapse_day_keys(journal_entries: list[models.JournalEntry]) -> set[str]:
    relapse_day_keys: set[str] = set()
    for entry in journal_entries:
        if entry.is_relapse:
            relapse_day_keys.add(to_utc_date_key(period_start(entry.timestamp, "day")))
    return relapse_day_keys


def _calculate_current_math(
    tracker: models.Tracker,
    habit_logs: list[models.HabitLog],
) -> schemas.TrackerCurrentMath:
    start_date = tracker.start_date
    if start_date is None:
        return schemas.TrackerCurrentMath()

    diff_ms = (datetime.utcnow() - start_date).total_seconds() * 1000.0
    units_interval = get_interval_count(tracker)

    def time_based_units() -> float:
        return float(tracker.units_per_amount or 0) * (
            diff_ms / (_get_ms_per_period(tracker.units_per) * units_interval)
        )

    if tracker.type == "quit":
        time_based_impact = float(tracker.impact_amount or 0) * (diff_ms / _get_ms_per_period(tracker.impact_per))
        return schemas.TrackerCurrentMath(
            main_unit=max(0.0, time_based_units()),
            target_unit=0.0,
            impact_value=max(0.0, time_based_impact),
        )

    actual_logged_units = sum(float(log.amount or 0) for log in habit_logs)
    impact_per_ms = float(tracker.impact_amount or 0) / _get_ms_per_period(tracker.impact_per)
    units_per_ms = (
        float(tracker.units_per_amount or 0)
        / (_get_ms_per_period(tracker.units_per) * units_interval)
        if float(tracker.units_per_amount or 0) > 0
        else 0.0
    )
    impact_per_unit = impact_per_ms / units_per_ms if units_per_ms > 0 else 0.0

    return schemas.TrackerCurrentMath(
        main_unit=actual_logged_units,
        target_unit=max(0.0, time_based_units()),
        impact_value=max(0.0, actual_logged_units * impact_per_unit),
    )


def _calculate_daily_progress(
    tracker: models.Tracker,
    habit_logs: list[models.HabitLog],
) -> schemas.TrackerDailyProgress:
    if tracker.start_date is None or tracker.type not in {"build", "boolean"}:
        return schemas.TrackerDailyProgress()

    period_to_check = tracker.units_per
    interval_count = get_interval_count(tracker)
    anchor = period_start(tracker.start_date, period_to_check)
    window = get_window_details(datetime.utcnow(), anchor, period_to_check, interval_count)

    period_logs = [
        log
        for log in habit_logs
        if window["start"] <= log.timestamp < window["end"]
    ]

    window_total = sum(float(log.amount or 0) for log in period_logs)
    window_target = 1.0 if tracker.type == "boolean" else max(0.0, float(tracker.units_per_amount or 0))
    percentage = min(100.0, (window_total / window_target) * 100) if window_target > 0 else 0.0

    return schemas.TrackerDailyProgress(total=window_total, target=window_target, percentage=percentage)


def _calculate_streak_stats(
    tracker: models.Tracker,
    habit_logs: list[models.HabitLog],
    journal_entries: list[models.JournalEntry],
) -> schemas.TrackerStreakStats:
    if tracker.start_date is None:
        return schemas.TrackerStreakStats()

    if tracker.type == "quit":
        today = period_start(datetime.utcnow(), "day")
        tracker_start_day = period_start(tracker.start_date, "day")
        relapse_days = sorted(
            period_start(entry.timestamp, "day")
            for entry in journal_entries
            if entry.is_relapse
        )

        segment_start = tracker_start_day
        longest = 0
        for relapse_day in relapse_days:
            span_days = max(0, (relapse_day - segment_start).days)
            longest = max(longest, span_days)
            segment_start = add_period(relapse_day, "day")

        current = 0
        if today >= segment_start:
            current = (today - segment_start).days + 1

        longest = max(longest, current)
        return schemas.TrackerStreakStats(current=current, longest=longest, period_label="days")

    streak_period = tracker.units_per if tracker.type in {"boolean", "build"} else "day"
    interval_count = get_interval_count(tracker)
    threshold = (
        1.0
        if tracker.type == "boolean"
        else max(0.0, float(tracker.units_per_amount or 0))
        if tracker.type == "build"
        else 0.0001
    )

    tracker_start = period_start(tracker.start_date, streak_period)
    totals_by_window: dict[int, float] = {}

    for log in habit_logs:
        window = get_window_details(log.timestamp, tracker_start, streak_period, interval_count)
        window_index = int(window["window_index"])
        if window_index < 0:
            continue
        totals_by_window[window_index] = totals_by_window.get(window_index, 0.0) + float(log.amount or 0)

    current_window = int(get_window_details(datetime.utcnow(), tracker_start, streak_period, interval_count)["window_index"])

    longest = 0
    running = 0
    completed_periods: list[bool] = []
    for index in range(current_window + 1):
        amount = totals_by_window.get(index, 0.0)
        done = amount >= threshold
        completed_periods.append(done)

        if done:
            running += 1
            longest = max(longest, running)
        else:
            running = 0

    current = 0
    for completed in reversed(completed_periods):
        if not completed:
            break
        current += 1

    return schemas.TrackerStreakStats(
        current=current,
        longest=longest,
        period_label=get_period_label(streak_period, interval_count),
    )


def _get_completion_threshold(tracker: models.Tracker) -> float:
    if tracker.type == "quit":
        return 0.0
    if tracker.type == "boolean":
        return 1.0
    return max(0.0, float(tracker.units_per_amount or 0))


def _build_completion_history(
    tracker: models.Tracker,
    habit_logs: list[models.HabitLog],
    journal_entries: list[models.JournalEntry],
) -> list[bool]:
    if tracker.start_date is None:
        return []

    if tracker.type == "quit":
        today = period_start(datetime.utcnow(), "day")
        tracker_start_day = period_start(tracker.start_date, "day")
        relapse_days = {
            period_start(entry.timestamp, "day")
            for entry in journal_entries
            if entry.is_relapse
        }

        history: list[bool] = []
        cursor = tracker_start_day
        while cursor <= today:
            history.append(cursor not in relapse_days)
            cursor = add_period(cursor, "day")
        return history

    streak_period = tracker.units_per
    interval_count = get_interval_count(tracker)
    tracker_start = period_start(tracker.start_date, streak_period)
    current_window = int(get_window_details(datetime.utcnow(), tracker_start, streak_period, interval_count)["window_index"])
    threshold = _get_completion_threshold(tracker)

    totals_by_window: dict[int, float] = {}
    for log in habit_logs:
        window = get_window_details(log.timestamp, tracker_start, streak_period, interval_count)
        window_index = int(window["window_index"])
        if window_index < 0:
            continue
        totals_by_window[window_index] = totals_by_window.get(window_index, 0.0) + float(log.amount or 0)

    return [totals_by_window.get(index, 0.0) >= threshold for index in range(current_window + 1)]


def _build_member_progress(
    tracker: models.Tracker,
    user: models.User,
    habit_logs: list[models.HabitLog],
    journal_entries: list[models.JournalEntry],
) -> schemas.TrackerMemberProgress:
    latest_activity = max(
        [*[log.timestamp for log in habit_logs], *[entry.timestamp for entry in journal_entries]],
        default=None,
    )

    return schemas.TrackerMemberProgress(
        user=schemas.User.model_validate(user),
        current_math=_calculate_current_math(tracker, habit_logs),
        daily_progress=_calculate_daily_progress(tracker, habit_logs),
        streak_stats=_calculate_streak_stats(tracker, habit_logs, journal_entries),
        last_activity_at=latest_activity,
    )


def _calculate_group_streak_stats(
    tracker: models.Tracker,
    member_logs: dict[int, list[models.HabitLog]],
    member_journals: dict[int, list[models.JournalEntry]],
) -> schemas.GroupStreakStats | None:
    if tracker.group_id is None or tracker.start_date is None:
        return None

    histories: list[list[bool]] = []
    for user_id in sorted(member_logs.keys() | member_journals.keys()):
        histories.append(
            _build_completion_history(
                tracker,
                member_logs.get(user_id, []),
                member_journals.get(user_id, []),
            )
        )

    if not histories:
        return schemas.GroupStreakStats(current=0, longest=0, period_label=get_period_label(tracker.units_per if tracker.type != "quit" else "day", get_interval_count(tracker)))

    max_length = max(len(history) for history in histories)
    group_history: list[bool] = []
    for index in range(max_length):
        period_done = all(history[index] if index < len(history) else False for history in histories)
        group_history.append(period_done)

    current = 0
    longest = 0
    run = 0
    for period_done in group_history:
        if period_done:
            run += 1
            longest = max(longest, run)
        else:
            run = 0

    for period_done in reversed(group_history):
        if not period_done:
            break
        current += 1

    period_label = "days" if tracker.type == "quit" else get_period_label(tracker.units_per, get_interval_count(tracker))
    return schemas.GroupStreakStats(current=current, longest=longest, period_label=period_label)


def build_tracker_share_stats(
    tracker: models.Tracker,
    participants: list[models.User],
    member_logs: dict[int, list[models.HabitLog]],
    member_journals: dict[int, list[models.JournalEntry]],
) -> schemas.TrackerShareStats:
    leaderboard: list[schemas.TrackerLeaderboardEntry] = []

    for user in participants:
        logs = member_logs.get(user.id, [])
        journals = member_journals.get(user.id, [])
        leaderboard.append(
            schemas.TrackerLeaderboardEntry(
                user=schemas.User.model_validate(user),
                current_math=_calculate_current_math(tracker, logs),
                daily_progress=_calculate_daily_progress(tracker, logs),
                streak_stats=_calculate_streak_stats(tracker, logs, journals),
                last_activity_at=max(
                    [*[log.timestamp for log in logs], *[entry.timestamp for entry in journals]],
                    default=None,
                ),
            )
        )

    leaderboard.sort(
        key=lambda entry: (
            -entry.streak_stats.current,
            -entry.daily_progress.percentage,
            -(entry.last_activity_at.timestamp() if entry.last_activity_at else 0.0),
            entry.user.username.lower(),
        )
    )

    return schemas.TrackerShareStats(
        member_count=len(participants),
        tracker_participants=[
            schemas.TrackerParticipant(user=entry.user, role="participant", added_at=None) for entry in leaderboard
        ],
        leaderboard=leaderboard,
        group_streak_stats=_calculate_group_streak_stats(tracker, member_logs, member_journals),
    )


def _build_historical_chart_data(
    tracker: models.Tracker,
    habit_logs: list[models.HabitLog],
    journal_entries: list[models.JournalEntry],
) -> list[schemas.TrackerChartPoint]:
    now = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    lookback_days = 120
    start_date = now - timedelta(days=lookback_days - 1)

    daily_log_map = _build_daily_log_map(habit_logs)
    relapse_day_keys = _build_relapse_day_keys(journal_entries)

    if tracker.start_date is None:
        return []

    if tracker.type == "quit":
        tracker_start = period_start(tracker.start_date, "day")
        points: list[schemas.TrackerChartPoint] = []
        running_streak = 0

        for index in range(lookback_days):
            cursor = start_date + timedelta(days=index)
            key = to_utc_date_key(cursor)

            if cursor < tracker_start:
                running_streak = 0
            elif key in relapse_day_keys:
                running_streak = 0
            else:
                running_streak += 1

            points.append(
                schemas.TrackerChartPoint(
                    date=key,
                    label=format_short_date(cursor),
                    value=running_streak,
                )
            )
        return points

    points: list[schemas.TrackerChartPoint] = []
    running_total = 0.0
    for index in range(lookback_days):
        cursor = start_date + timedelta(days=index)
        key = to_utc_date_key(cursor)
        daily_amount = daily_log_map.get(key, 0.0)
        running_total += daily_amount

        points.append(
            schemas.TrackerChartPoint(
                date=key,
                label=format_short_date(cursor),
                value=daily_amount,
                cumulative=round(running_total, 2),
            )
        )
    return points


def _build_heatmap(
    tracker: models.Tracker,
    habit_logs: list[models.HabitLog],
) -> schemas.TrackerHeatmap | None:
    if tracker.start_date is None or tracker.type != "build":
        return None

    days = 168
    end = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start = end - timedelta(days=days - 1)
    start_weekday = (start.weekday() + 1) % 7
    aligned_start = start - timedelta(days=start_weekday)

    daily_log_map = _build_daily_log_map(habit_logs)
    cells: list[schemas.TrackerHeatmapCell] = []
    cursor = aligned_start
    while cursor <= end:
        key = to_utc_date_key(cursor)
        amount = 0.0 if cursor < start else daily_log_map.get(key, 0.0)
        cells.append(
            schemas.TrackerHeatmapCell(
                date=key,
                amount=amount,
                is_filler=cursor < start,
            )
        )
        cursor += timedelta(days=1)

    max_amount = max([0.0, *[cell.amount for cell in cells]])
    columns = [cells[index : index + 7] for index in range(0, len(cells), 7)]

    return schemas.TrackerHeatmap(columns=columns, max_amount=max_amount)


def build_tracker_analytics(
    tracker: models.Tracker,
    habit_logs: list[models.HabitLog],
    journal_entries: list[models.JournalEntry],
    current_user_id: int | None = None,
    participants: list[models.User] | None = None,
    member_logs: dict[int, list[models.HabitLog]] | None = None,
    member_journals: dict[int, list[models.JournalEntry]] | None = None,
) -> schemas.TrackerAnalytics:
    active_logs = habit_logs
    active_journals = journal_entries

    if current_user_id is not None and member_logs is not None and member_journals is not None:
        active_logs = member_logs.get(current_user_id, [])
        active_journals = member_journals.get(current_user_id, [])

    share_stats = None
    member_progress: list[schemas.TrackerMemberProgress] = []
    if tracker.group_id is not None and participants is not None and member_logs is not None and member_journals is not None:
        share_stats = build_tracker_share_stats(tracker, participants, member_logs, member_journals)
        member_progress = [
            _build_member_progress(tracker, participant, member_logs.get(participant.id, []), member_journals.get(participant.id, []))
            for participant in participants
        ]

    return schemas.TrackerAnalytics(
        tracker_id=tracker.id,
        current_math=_calculate_current_math(tracker, active_logs),
        daily_progress=_calculate_daily_progress(tracker, active_logs),
        historical_chart_data=_build_historical_chart_data(tracker, active_logs, active_journals),
        streak_stats=_calculate_streak_stats(tracker, active_logs, active_journals),
        build_heatmap=_build_heatmap(tracker, active_logs),
        member_progress=member_progress,
        share_stats=share_stats,
        current_user_id=current_user_id,
    )


def _get_impact_per_day(tracker: models.Tracker) -> float:
    impact_amount = float(tracker.impact_amount or 0)
    if impact_amount <= 0 or tracker.type == "boolean":
        return 0.0

    return (impact_amount / _get_ms_per_period(tracker.impact_per)) * DAY_MS


def build_dashboard_summary(
    trackers: list[models.Tracker],
    habit_logs: list[models.HabitLog],
    journal_entries: list[models.JournalEntry],
) -> schemas.DashboardSummary:
    logs_by_tracker_id: dict[int, list[models.HabitLog]] = {}
    for log in habit_logs:
        logs_by_tracker_id.setdefault(log.tracker_id, []).append(log)

    journals_by_tracker_id: dict[int, list[models.JournalEntry]] = {}
    for entry in journal_entries:
        journals_by_tracker_id.setdefault(entry.tracker_id, []).append(entry)

    impact_rows: list[schemas.DashboardImpactRow] = []
    category_counts: dict[str, int] = {}
    by_type: dict[str, int] = {"quit": 0, "build": 0, "boolean": 0}
    group_ids: set[int] = set()

    for tracker in trackers:
        category = tracker.category.strip() if isinstance(tracker.category, str) and tracker.category.strip() else "General"
        category_counts[category] = category_counts.get(category, 0) + 1
        by_type[tracker.type] = by_type.get(tracker.type, 0) + 1
        if tracker.group_id is not None:
            group_ids.add(tracker.group_id)

        tracker_logs = logs_by_tracker_id.get(tracker.id, [])
        tracker_journals = journals_by_tracker_id.get(tracker.id, [])

        analytics = build_tracker_analytics(tracker, tracker_logs, tracker_journals)
        month_impact = _get_impact_per_day(tracker) * 30

        impact_rows.append(
            schemas.DashboardImpactRow(
                tracker=tracker,
                main_amount=analytics.current_math.main_unit,
                impact_value=analytics.current_math.impact_value,
                month_impact=month_impact,
                mode_label=(
                    "Time based"
                    if tracker.type == "quit"
                    else "From logs"
                    if tracker.type in {"build", "boolean"} and float(tracker.impact_amount or 0) > 0
                    else "No impact configured"
                ),
            )
        )

    sorted_impact_rows = [
        row
        for row in impact_rows
        if row.tracker.type != "boolean" and float(row.tracker.impact_amount or 0) > 0
    ]
    sorted_impact_rows.sort(key=lambda row: row.month_impact, reverse=True)

    category_breakdown = [
        schemas.DashboardCategoryStat(category=category, count=count)
        for category, count in sorted(category_counts.items(), key=lambda item: (-item[1], item[0].lower()))
    ]

    total = len(trackers)
    active = sum(1 for tracker in trackers if tracker.is_active)

    return schemas.DashboardSummary(
        overview=schemas.DashboardOverview(
            total=total,
            active=active,
            paused=max(0, total - active),
            categories=len(category_counts),
            groups=len(group_ids),
            by_type=by_type,
            shared_trackers=sum(1 for tracker in trackers if tracker.group_id is not None),
        ),
        category_breakdown=category_breakdown,
        impact_rows=impact_rows,
        top_impact_rows=sorted_impact_rows[:6],
    )