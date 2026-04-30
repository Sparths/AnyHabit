import csv
import json
from io import StringIO
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..analytics import build_tracker_analytics
from ..deps import get_current_user, get_db
from ..time_utils import ensure_utc

router = APIRouter(prefix="/export", tags=["export"])


def _format_timestamp(dt) -> str:
    """Format datetime to ISO format string"""
    if dt is None:
        # Return current UTC time
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
    normalized = ensure_utc(dt)
    return normalized.isoformat() if normalized else ""


def _get_tracker_logs_with_calculations(db: Session, tracker: models.Tracker, user_id: int) -> List[dict]:
    """Get habit logs for a tracker with calculated fields"""
    logs = (
        db.query(models.HabitLog)
        .filter(models.HabitLog.tracker_id == tracker.id, models.HabitLog.user_id == user_id)
        .order_by(models.HabitLog.timestamp.asc())
        .all()
    )

    result = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "tracker_id": log.tracker_id,
            "timestamp": _format_timestamp(log.timestamp),
            "date": _format_timestamp(log.timestamp).split("T")[0],
            "amount": float(log.amount),
            "unit": tracker.unit or "",
        }

        # Add impact calculation if applicable
        if tracker.impact_amount and tracker.impact_per:
            impact = float(log.amount) * float(tracker.impact_amount)
            log_dict["impact"] = round(impact, 2)
            log_dict["impact_unit"] = tracker.impact_unit or ""

        result.append(log_dict)

    return result


def _get_tracker_journals_with_calculations(db: Session, tracker: models.Tracker, user_id: int) -> List[dict]:
    """Get journal entries for a tracker with calculated fields"""
    journals = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.tracker_id == tracker.id, models.JournalEntry.user_id == user_id)
        .order_by(models.JournalEntry.timestamp.asc())
        .all()
    )

    result = []
    for journal in journals:
        mood_label = None
        if journal.mood is not None:
            mood_labels = {
                1: "Very Bad",
                2: "Bad",
                3: "Neutral",
                4: "Good",
                5: "Very Good"
            }
            mood_label = mood_labels.get(journal.mood)

        journal_dict = {
            "id": journal.id,
            "tracker_id": journal.tracker_id,
            "timestamp": _format_timestamp(journal.timestamp),
            "date": _format_timestamp(journal.timestamp).split("T")[0],
            "mood": journal.mood,
            "mood_label": mood_label,
            "content": journal.content or "",
            "is_relapse": journal.is_relapse,
        }
        result.append(journal_dict)

    return result


def _get_tracker_info_with_stats(db: Session, tracker: models.Tracker, user_id: int) -> dict:
    """Get tracker info with calculated statistics"""
    # Get logs and journals for analytics
    logs = (
        db.query(models.HabitLog)
        .filter(models.HabitLog.tracker_id == tracker.id, models.HabitLog.user_id == user_id)
        .all()
    )

    journals = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.tracker_id == tracker.id, models.JournalEntry.user_id == user_id)
        .all()
    )

    # Get analytics with correct parameters
    analytics = build_tracker_analytics(tracker, logs, journals, current_user_id=user_id)

    tracker_dict = {
        "id": tracker.id,
        "name": tracker.name,
        "category": tracker.category,
        "type": tracker.type,
        "start_date": _format_timestamp(tracker.start_date),
        "current_streak_start_date": _format_timestamp(tracker.current_streak_start_date),
        "is_active": tracker.is_active,
        "unit": tracker.unit or "",
        "impact_unit": tracker.impact_unit or "",
        "impact_per": tracker.impact_per or "",
        "impact_amount": float(tracker.impact_amount) if tracker.impact_amount else None,
        "units_per": tracker.units_per or "",
        "units_per_interval": tracker.units_per_interval or 1,
        "units_per_amount": float(tracker.units_per_amount) if tracker.units_per_amount else None,
    }

    # Add calculated statistics
    if analytics:
        tracker_dict["statistics"] = {
            "total_logs": len(logs),
            "current_streak": analytics.streak_stats.current if analytics.streak_stats else 0,
            "longest_streak": analytics.streak_stats.longest if analytics.streak_stats else 0,
            "streak_period": analytics.streak_stats.period_label if analytics.streak_stats else "days",
            "current_amount": float(analytics.current_math.main_unit) if analytics.current_math else 0,
            "target_amount": float(analytics.current_math.target_unit) if analytics.current_math else 0,
            "impact_value": float(analytics.current_math.impact_value) if analytics.current_math else 0,
            "daily_progress": float(analytics.daily_progress.percentage) if analytics.daily_progress else 0,
        }

    return tracker_dict


@router.get("/")
def export_data(
    data_type: str = Query("all", description="Type of data to export: all, trackers_only, journals_only, specific"),
    format: str = Query("json", description="Export format: json or csv"),
    tracker_id: Optional[List[int]] = Query(None, description="Tracker IDs for specific export"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> Response:
    """
    Export user data in specified format.
    
    Parameters:
    - data_type: 'all' (everything), 'trackers_only' (trackers + logs), 'journals_only' (journals), 'specific' (selected trackers)
    - format: 'json' or 'csv'
    - tracker_id: List of tracker IDs to export (used with data_type='specific')
    """

    # Validate data_type
    if data_type not in ["all", "trackers_only", "journals_only", "specific"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid data_type")

    if format not in ["json", "csv"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid format")

    # Get user's trackers
    user_trackers = db.query(models.Tracker).filter(models.Tracker.owner_id == current_user.id).all()

    # Filter trackers based on data_type
    if data_type == "specific":
        if not tracker_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="tracker_id required for specific export")
        selected_tracker_ids = set(tracker_id)
        export_trackers = [t for t in user_trackers if t.id in selected_tracker_ids]
    else:
        export_trackers = user_trackers

    # Prepare export data
    export_data = {
        "export_date": _format_timestamp(None),  # Current UTC time
        "user": current_user.username,
        "email": current_user.email,
        "data_type": data_type,
    }

    if data_type != "journals_only":
        # Export trackers and logs
        export_data["trackers"] = []
        for tracker in export_trackers:
            tracker_info = _get_tracker_info_with_stats(db, tracker, current_user.id)
            tracker_info["logs"] = _get_tracker_logs_with_calculations(db, tracker, current_user.id)

            # Only add journals if data_type is 'all'
            if data_type == "all":
                tracker_info["journals"] = _get_tracker_journals_with_calculations(db, tracker, current_user.id)

            export_data["trackers"].append(tracker_info)

    if data_type in ["all", "journals_only"]:
        # Export journals
        all_journals = (
            db.query(models.JournalEntry)
            .filter(models.JournalEntry.user_id == current_user.id)
            .all()
        )

        if data_type == "journals_only":
            export_data["journals"] = []
            for journal in all_journals:
                mood_label = None
                if journal.mood is not None:
                    mood_labels = {1: "Very Bad", 2: "Bad", 3: "Neutral", 4: "Good", 5: "Very Good"}
                    mood_label = mood_labels.get(journal.mood)

                tracker_name = ""
                if journal.tracker_id:
                    tracker = db.query(models.Tracker).filter(models.Tracker.id == journal.tracker_id).first()
                    tracker_name = tracker.name if tracker else ""

                export_data["journals"].append(
                    {
                        "id": journal.id,
                        "tracker_name": tracker_name,
                        "tracker_id": journal.tracker_id,
                        "timestamp": _format_timestamp(journal.timestamp),
                        "date": _format_timestamp(journal.timestamp).split("T")[0],
                        "mood": journal.mood,
                        "mood_label": mood_label,
                        "content": journal.content or "",
                        "is_relapse": journal.is_relapse,
                    }
                )

    # Format output
    if format == "json":
        json_str = json.dumps(export_data, indent=2, default=str)
        return Response(content=json_str, media_type="application/json")
    else:  # CSV format
        output = StringIO()
        writer = csv.writer(output)

        # Write header with metadata
        writer.writerow(["AnyHabit Data Export"])
        writer.writerow(["Export Date", _format_timestamp(None)])
        writer.writerow(["User", current_user.username])
        writer.writerow(["Email", current_user.email])
        writer.writerow([])

        if data_type != "journals_only":
            # Write trackers section
            for tracker in export_trackers:
                writer.writerow(["Tracker:", tracker.name])
                writer.writerow(["Category", tracker.category])
                writer.writerow(["Type", tracker.type])
                writer.writerow(["Unit", tracker.unit or ""])
                writer.writerow(["Start Date", _format_timestamp(tracker.start_date)])
                writer.writerow(["Is Active", "Yes" if tracker.is_active else "No"])
                writer.writerow([])

                # Write logs
                logs = _get_tracker_logs_with_calculations(db, tracker, current_user.id)
                if logs:
                    writer.writerow(["Logs:"])
                    log_headers = list(logs[0].keys()) if logs else []
                    writer.writerow(log_headers)
                    for log in logs:
                        writer.writerow([log.get(h, "") for h in log_headers])
                    writer.writerow([])

                # Write journals if data_type is 'all'
                if data_type == "all":
                    journals = _get_tracker_journals_with_calculations(db, tracker, current_user.id)
                    if journals:
                        writer.writerow(["Journals:"])
                        journal_headers = list(journals[0].keys()) if journals else []
                        writer.writerow(journal_headers)
                        for journal in journals:
                            writer.writerow([journal.get(h, "") for h in journal_headers])
                        writer.writerow([])

        if data_type in ["all", "journals_only"]:
            # Write journals section
            all_journals = (
                db.query(models.JournalEntry)
                .filter(models.JournalEntry.user_id == current_user.id)
                .all()
            )

            if all_journals and data_type == "journals_only":
                writer.writerow(["All Journals:"])
                writer.writerow(["Date", "Mood", "Mood Label", "Tracker", "Content", "Is Relapse"])
                for journal in all_journals:
                    mood_label = None
                    if journal.mood is not None:
                        mood_labels = {1: "Very Bad", 2: "Bad", 3: "Neutral", 4: "Good", 5: "Very Good"}
                        mood_label = mood_labels.get(journal.mood)

                    tracker_name = ""
                    if journal.tracker_id:
                        tracker = db.query(models.Tracker).filter(models.Tracker.id == journal.tracker_id).first()
                        tracker_name = tracker.name if tracker else ""

                    writer.writerow(
                        [
                            _format_timestamp(journal.timestamp).split("T")[0],
                            journal.mood or "",
                            mood_label or "",
                            tracker_name,
                            journal.content or "",
                            "Yes" if journal.is_relapse else "No",
                        ]
                    )

        csv_str = output.getvalue()
        return Response(content=csv_str, media_type="text/csv")
