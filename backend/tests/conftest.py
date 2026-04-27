import pytest
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from types import SimpleNamespace

from backend.database import Base
from backend.deps import get_db
from backend.main import app
from backend.models import Tracker, HabitLog, JournalEntry


# Use in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():
    """Create test database engine."""
    engine = create_engine(
        SQLALCHEMY_TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(engine):
    """Create a new database session for a test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Create test client with overridden db dependency."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    from fastapi.testclient import TestClient
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def sample_tracker(db_session):
    """Create a sample tracker for testing."""
    tracker = Tracker(
        name="Reading",
        category="Learning",
        type="build",
        start_date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
        unit="pages",
        units_per_amount=2,
        units_per="day",
        units_per_interval=1,
        impact_amount=5.0,
        impact_per="day",
    )
    db_session.add(tracker)
    db_session.commit()
    return tracker


@pytest.fixture
def sample_quit_tracker(db_session):
    """Create a sample quit tracker for testing."""
    now = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tracker = Tracker(
        name="Quit Smoking",
        category="Health",
        type="quit",
        start_date=now - timedelta(days=30),
        current_streak_start_date=now - timedelta(days=10),
        unit="days",
        units_per_amount=1,
        units_per="day",
        units_per_interval=1,
        impact_amount=10.0,
        impact_per="month",
    )
    db_session.add(tracker)
    db_session.commit()
    return tracker


@pytest.fixture
def sample_logs(db_session, sample_tracker):
    """Create sample habit logs for testing."""
    now = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    logs = [
        HabitLog(
            tracker_id=sample_tracker.id,
            timestamp=now - timedelta(days=i),
            amount=2.0
        )
        for i in range(5)
    ]
    db_session.add_all(logs)
    db_session.commit()
    return logs


@pytest.fixture
def sample_journals(db_session, sample_tracker):
    """Create sample journal entries for testing."""
    now = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    journals = [
        JournalEntry(
            tracker_id=sample_tracker.id,
            timestamp=now - timedelta(days=i),
            mood=5 + i % 4,
            content=f"Day {i} entry",
            is_relapse=False
        )
        for i in range(3)
    ]
    db_session.add_all(journals)
    db_session.commit()
    return journals


@pytest.fixture
def simple_namespace_tracker():
    """Create a SimpleNamespace tracker (for unit testing analytics functions)."""
    return SimpleNamespace(
        id=1,
        name="Test Tracker",
        type="build",
        start_date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=10),
        current_streak_start_date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=5),
        units_per_interval=1,
        units_per="day",
        units_per_amount=2,
        impact_amount=5.0,
        impact_per="day",
        unit="pages",
    )
