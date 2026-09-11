from __future__ import annotations

from typing import Any, Literal

from mcp.server import MCPServer

from anyhabit_client import AnyHabitClient
from config import Settings


TrackerType = Literal["quit", "build", "boolean"]
Period = Literal["day", "week", "month", "year"]
WeekStart = Literal["monday", "sunday", "saturday"]

settings = Settings.load()
api = AnyHabitClient(settings)

mcp = MCPServer(
    "AnyHabit",
    version="0.1.0",
    instructions=(
        "Control and inspect an AnyHabit instance. Resolve tracker names to IDs "
        "before mutating them. Prefer archive over permanent deletion. Use "
        "record_relapse only when the user explicitly wants to reset a quit "
        "streak. Irreversible tools may be disabled by server configuration."
    ),
)


def _without_none(**values: Any) -> dict[str, Any]:
    return {key: value for key, value in values.items() if value is not None}


# ---------------------------------------------------------------------------
# System and account
# ---------------------------------------------------------------------------


@mcp.tool()
def health_check() -> dict[str, Any]:
    """Check whether the configured AnyHabit instance is healthy.

    This tool does not require an AnyHabit API token.
    """
    return api.get("/health", auth=False)


@mcp.tool()
def get_current_user() -> dict[str, Any]:
    """Return the AnyHabit user associated with the configured API token."""
    return api.get("/auth/me")


@mcp.tool()
def update_preferences(
    timezone: str | None = None,
    week_start: WeekStart | None = None,
    username: str | None = None,
) -> dict[str, Any]:
    """Update current-user preferences. Only supplied fields are changed."""
    payload = _without_none(
        timezone=timezone,
        week_start=week_start,
        username=username,
    )
    if not payload:
        raise ValueError("Provide at least one preference to update.")
    return api.patch("/auth/me", json_body=payload)


# ---------------------------------------------------------------------------
# Trackers
# ---------------------------------------------------------------------------


@mcp.tool()
def list_trackers(include_archived: bool = False) -> list[dict[str, Any]]:
    """List all trackers accessible to the current user."""
    return api.get(
        "/trackers/",
        params={"include_archived": str(include_archived).lower()},
    )


@mcp.tool()
def search_trackers(
    query: str,
    include_archived: bool = False,
) -> list[dict[str, Any]]:
    """Find trackers by name, category, description, type, or unit.

    Use this before changing a tracker when the user referred to it by name
    rather than by numeric ID.
    """
    needle = query.strip().casefold()
    trackers = list_trackers(include_archived=include_archived)
    if not needle:
        return trackers

    fields = ("name", "category", "description", "type", "unit")
    return [
        tracker
        for tracker in trackers
        if any(
            needle in str(tracker.get(field, "")).casefold()
            for field in fields
        )
    ]


@mcp.tool()
def get_tracker(tracker_id: int) -> dict[str, Any]:
    """Get one tracker by numeric ID."""
    return api.get(f"/trackers/{tracker_id}/")


@mcp.tool()
def get_tracker_bundle(tracker_id: int) -> dict[str, Any]:
    """Get tracker, logs, journal entries, analytics and sharing data in one call."""
    return api.get(f"/trackers/{tracker_id}/bundle")


@mcp.tool()
def get_tracker_analytics(tracker_id: int) -> dict[str, Any]:
    """Return streaks, progress, consistency, charts and mood analytics."""
    return api.get(f"/trackers/{tracker_id}/analytics")


@mcp.tool()
def create_tracker(
    name: str,
    type: TrackerType,
    description: str = "",
    color: str = "",
    category: str = "General",
    impact_amount: float = 0.0,
    impact_unit: str = "$",
    impact_per: Period = "day",
    unit: str = "",
    units_per_amount: float = 0.0,
    units_per: Period = "day",
    units_per_interval: int = 1,
    is_active: bool = True,
    start_date: str | None = None,
    group_id: int | None = None,
    participant_ids: list[int] | None = None,
) -> dict[str, Any]:
    """Create an AnyHabit tracker.

    type=quit tracks time since a relapse, type=build accumulates amounts, and
    type=boolean records done/not-done per period. start_date is optional ISO-8601.
    """
    payload: dict[str, Any] = {
        "name": name,
        "type": type,
        "description": description,
        "color": color,
        "category": category,
        "impact_amount": impact_amount,
        "impact_unit": impact_unit,
        "impact_per": impact_per,
        "unit": unit,
        "units_per_amount": units_per_amount,
        "units_per": units_per,
        "units_per_interval": units_per_interval,
        "is_active": is_active,
        "participant_ids": participant_ids or [],
    }
    if start_date is not None:
        payload["start_date"] = start_date
    if group_id is not None:
        payload["group_id"] = group_id

    return api.post("/trackers/", json_body=payload)


@mcp.tool()
def update_tracker(
    tracker_id: int,
    name: str | None = None,
    description: str | None = None,
    color: str | None = None,
    category: str | None = None,
    type: TrackerType | None = None,
    impact_amount: float | None = None,
    impact_unit: str | None = None,
    impact_per: Period | None = None,
    unit: str | None = None,
    units_per_amount: float | None = None,
    units_per: Period | None = None,
    units_per_interval: int | None = None,
    is_active: bool | None = None,
    start_date: str | None = None,
    group_id: int | None = None,
    participant_ids: list[int] | None = None,
    clear_group: bool = False,
) -> dict[str, Any]:
    """Partially update a tracker.

    Only supplied values change. Set clear_group=true to make a shared tracker
    private again. Do not use clear_group together with group_id.
    """
    if clear_group and group_id is not None:
        raise ValueError("Use either clear_group=true or group_id, not both.")

    payload = _without_none(
        name=name,
        description=description,
        color=color,
        category=category,
        type=type,
        impact_amount=impact_amount,
        impact_unit=impact_unit,
        impact_per=impact_per,
        unit=unit,
        units_per_amount=units_per_amount,
        units_per=units_per,
        units_per_interval=units_per_interval,
        is_active=is_active,
        start_date=start_date,
        participant_ids=participant_ids,
    )
    if clear_group:
        payload["group_id"] = None
    elif group_id is not None:
        payload["group_id"] = group_id

    if not payload:
        raise ValueError("Provide at least one tracker field to update.")

    return api.patch(f"/trackers/{tracker_id}/", json_body=payload)


@mcp.tool()
def start_tracker(tracker_id: int) -> dict[str, Any]:
    """Resume a paused tracker."""
    return api.put(f"/trackers/{tracker_id}/start")


@mcp.tool()
def stop_tracker(tracker_id: int) -> dict[str, Any]:
    """Pause an active tracker."""
    return api.put(f"/trackers/{tracker_id}/stop")


@mcp.tool()
def archive_tracker(tracker_id: int) -> dict[str, Any]:
    """Archive a tracker without destroying its history."""
    return api.put(f"/trackers/{tracker_id}/archive")


@mcp.tool()
def unarchive_tracker(tracker_id: int) -> dict[str, Any]:
    """Restore an archived tracker."""
    return api.put(f"/trackers/{tracker_id}/unarchive")


@mcp.tool()
def record_relapse(tracker_id: int, note: str = "") -> dict[str, Any]:
    """Reset a quit tracker's current run by recording a relapse.

    Use only when the user explicitly says the quit streak/run should reset.
    """
    return api.post(
        f"/trackers/{tracker_id}/reset",
        params={"note": note},
    )


@mcp.tool()
def delete_tracker(tracker_id: int) -> dict[str, Any]:
    """Permanently delete a tracker and all of its history.

    Irreversible and disabled unless ANYHABIT_MCP_ALLOW_DESTRUCTIVE=true.
    """
    api.require_destructive("Permanent tracker deletion")
    return api.delete(f"/trackers/{tracker_id}")


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------


@mcp.tool()
def list_logs(
    tracker_id: int,
    mine_only: bool = True,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """List activity logs for a tracker, newest first."""
    return api.get(
        f"/trackers/{tracker_id}/logs/",
        params={
            "mine_only": str(mine_only).lower(),
            "limit": limit,
        },
    )


@mcp.tool()
def log_progress(
    tracker_id: int,
    amount: float = 1.0,
    note: str = "",
    timestamp: str | None = None,
) -> dict[str, Any]:
    """Record progress/activity.

    timestamp is optional ISO-8601. Use record_relapse instead for a quit
    tracker relapse.
    """
    payload: dict[str, Any] = {"amount": amount, "note": note}
    if timestamp is not None:
        payload["timestamp"] = timestamp
    return api.post(f"/trackers/{tracker_id}/logs/", json_body=payload)


@mcp.tool()
def update_log(
    tracker_id: int,
    log_id: int,
    amount: float | None = None,
    note: str | None = None,
    timestamp: str | None = None,
) -> dict[str, Any]:
    """Correct an existing activity log."""
    payload = _without_none(
        amount=amount,
        note=note,
        timestamp=timestamp,
    )
    if not payload:
        raise ValueError("Provide at least one log field to update.")
    return api.patch(
        f"/trackers/{tracker_id}/logs/{log_id}",
        json_body=payload,
    )


@mcp.tool()
def delete_log(tracker_id: int, log_id: int) -> dict[str, Any]:
    """Permanently delete an activity log.

    Disabled unless ANYHABIT_MCP_ALLOW_DESTRUCTIVE=true.
    """
    api.require_destructive("Log deletion")
    return api.delete(f"/trackers/{tracker_id}/logs/{log_id}")


# ---------------------------------------------------------------------------
# Journal
# ---------------------------------------------------------------------------


@mcp.tool()
def list_journal_entries(
    tracker_id: int,
    mine_only: bool = True,
    search: str = "",
    limit: int = 100,
) -> list[dict[str, Any]]:
    """List or text-search journal entries for a tracker."""
    return api.get(
        f"/trackers/{tracker_id}/journal/",
        params={
            "mine_only": str(mine_only).lower(),
            "search": search,
            "limit": limit,
        },
    )


@mcp.tool()
def add_journal_entry(
    tracker_id: int,
    content: str,
    mood: int | None = None,
    timestamp: str | None = None,
) -> dict[str, Any]:
    """Add a private journal entry. mood is optional from 1 to 5."""
    payload: dict[str, Any] = {"content": content}
    if mood is not None:
        payload["mood"] = mood
    if timestamp is not None:
        payload["timestamp"] = timestamp
    return api.post(
        f"/trackers/{tracker_id}/journal/",
        json_body=payload,
    )


@mcp.tool()
def update_journal_entry(
    tracker_id: int,
    journal_id: int,
    content: str,
    mood: int | None = None,
) -> dict[str, Any]:
    """Edit one of the current user's journal entries."""
    payload: dict[str, Any] = {"content": content}
    if mood is not None:
        payload["mood"] = mood
    return api.put(
        f"/trackers/{tracker_id}/journal/{journal_id}",
        json_body=payload,
    )


@mcp.tool()
def delete_journal_entry(
    tracker_id: int,
    journal_id: int,
) -> dict[str, Any]:
    """Permanently delete one journal entry.

    Disabled unless ANYHABIT_MCP_ALLOW_DESTRUCTIVE=true.
    """
    api.require_destructive("Journal entry deletion")
    return api.delete(f"/trackers/{tracker_id}/journal/{journal_id}")


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


@mcp.tool()
def get_dashboard_summary() -> dict[str, Any]:
    """Return overall totals, categories, streaks and today's progress."""
    return api.get("/dashboard/summary")


@mcp.tool()
def get_recent_activity(limit: int = 20) -> dict[str, Any]:
    """Return recent logs and journal activity across trackers."""
    return api.get("/dashboard/activity", params={"limit": limit})


@mcp.tool()
def get_dashboard_home() -> dict[str, Any]:
    """Return the saved home-dashboard widget layout."""
    return api.get("/dashboard/home")


@mcp.tool()
def save_dashboard_home(
    widgets: list[dict[str, Any]],
    layouts: dict[str, Any],
) -> dict[str, Any]:
    """Save the home-dashboard widget/layout configuration."""
    return api.put(
        "/dashboard/home",
        json_body={"widgets": widgets, "layouts": layouts},
    )


# ---------------------------------------------------------------------------
# Groups
# ---------------------------------------------------------------------------


@mcp.tool()
def list_groups() -> list[dict[str, Any]]:
    """List groups the current user owns or belongs to."""
    return api.get("/groups/")


@mcp.tool()
def get_group(group_id: int) -> dict[str, Any]:
    """Get one group and its membership information."""
    return api.get(f"/groups/{group_id}")


@mcp.tool()
def list_group_members(group_id: int) -> list[dict[str, Any]]:
    """List the members of a group."""
    return api.get(f"/groups/{group_id}/members")


@mcp.tool()
def create_group(name: str) -> dict[str, Any]:
    """Create a new AnyHabit sharing group."""
    return api.post("/groups/", json_body={"name": name})


@mcp.tool()
def join_group(join_code: str) -> dict[str, Any]:
    """Join a group with its join code."""
    return api.post("/groups/join", json_body={"join_code": join_code})


@mcp.tool()
def rename_group(group_id: int, name: str) -> dict[str, Any]:
    """Rename a group. Only the group owner can do this."""
    return api.patch(f"/groups/{group_id}", json_body={"name": name})


@mcp.tool()
def rotate_group_join_code(group_id: int) -> dict[str, Any]:
    """Generate a new join code, invalidating the previous one."""
    return api.post(f"/groups/{group_id}/rotate-code")


@mcp.tool()
def leave_group(group_id: int) -> dict[str, Any]:
    """Leave a group the current user does not own."""
    return api.post(f"/groups/{group_id}/leave")


@mcp.tool()
def remove_group_member(group_id: int, user_id: int) -> dict[str, Any]:
    """Remove a member from a group.

    Disabled unless ANYHABIT_MCP_ALLOW_DESTRUCTIVE=true.
    """
    api.require_destructive("Removing a group member")
    return api.delete(f"/groups/{group_id}/members/{user_id}")


@mcp.tool()
def delete_group(group_id: int) -> dict[str, Any]:
    """Disband a group.

    Disabled unless ANYHABIT_MCP_ALLOW_DESTRUCTIVE=true.
    """
    api.require_destructive("Group deletion")
    return api.delete(f"/groups/{group_id}")


if __name__ == "__main__":
    if settings.transport == "stdio":
        mcp.run()
    else:
        mcp.run(
            transport="streamable-http",
            host=settings.host,
            port=settings.port,
            streamable_http_path=settings.path,
            stateless_http=settings.stateless_http,
        )
