from datetime import datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def to_utc(value: datetime) -> datetime:
    normalized = ensure_utc(value)
    if normalized is None:
        raise ValueError("Datetime value is required")
    return normalized


def utcnow_naive() -> datetime:
    return utcnow()


def to_utc_naive(value: datetime) -> datetime:
    return to_utc(value)
