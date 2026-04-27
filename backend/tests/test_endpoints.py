import pytest
from datetime import datetime, timedelta
from backend.models import Tracker, HabitLog, JournalEntry


class TestTrackerEndpoints:
    """Test tracker API endpoints."""

    def test_get_analytics_endpoint(self, client, sample_tracker, sample_logs):
        """Test GET /trackers/{id}/analytics endpoint."""
        response = client.get(f"/trackers/{sample_tracker.id}/analytics")
        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "current_math" in data
        assert "daily_progress" in data
        assert "streak_stats" in data
        assert "historical_chart_data" in data

        # Check current_math values
        assert "main_unit" in data["current_math"]
        assert "target_unit" in data["current_math"]
        assert "impact_value" in data["current_math"]

    def test_get_analytics_endpoint_nonexistent(self, client):
        """Test GET /trackers/{id}/analytics with nonexistent tracker."""
        response = client.get("/trackers/99999/analytics")
        assert response.status_code == 404

    def test_get_bundle_endpoint(self, client, sample_tracker, sample_logs, sample_journals):
        """Test GET /trackers/{id}/bundle endpoint."""
        response = client.get(f"/trackers/{sample_tracker.id}/bundle")
        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "tracker" in data
        assert "habit_logs" in data
        assert "journal_entries" in data
        assert "analytics" in data

        # Verify tracker data
        tracker_data = data["tracker"]
        assert tracker_data["name"] == sample_tracker.name
        assert tracker_data["category"] == sample_tracker.category

        # Verify logs are included
        assert len(data["habit_logs"]) == len(sample_logs)

        # Verify journals are included
        assert len(data["journal_entries"]) == len(sample_journals)

    def test_get_bundle_endpoint_empty_logs(self, client, sample_tracker):
        """Test bundle endpoint with tracker that has no logs."""
        response = client.get(f"/trackers/{sample_tracker.id}/bundle")
        assert response.status_code == 200
        data = response.json()

        assert data["habit_logs"] == []
        assert data["journal_entries"] == []
        assert data["tracker"]["id"] == sample_tracker.id

    def test_get_bundle_endpoint_quit_tracker(self, client, sample_quit_tracker):
        """Test bundle endpoint with quit-type tracker."""
        response = client.get(f"/trackers/{sample_quit_tracker.id}/bundle")
        assert response.status_code == 200
        data = response.json()

        assert data["tracker"]["type"] == "quit"
        assert data["analytics"] is not None


class TestDashboardEndpoints:
    """Test dashboard API endpoints."""

    def test_get_dashboard_summary_endpoint_empty(self, client):
        """Test GET /dashboard/summary with no trackers."""
        response = client.get("/dashboard/summary")
        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "overview" in data
        assert "category_breakdown" in data
        assert "impact_rows" in data
        assert "top_impact_rows" in data

        # Empty dashboard should have zero counts
        assert data["overview"]["total"] == 0
        assert data["overview"]["active"] == 0
        assert data["overview"]["paused"] == 0

    def test_get_dashboard_summary_endpoint_with_trackers(
        self, client, db_session, sample_tracker, sample_logs
    ):
        """Test GET /dashboard/summary with trackers."""
        # Add another tracker
        tracker2 = Tracker(
            name="Exercise",
            category="Health",
            type="build",
            start_date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
            unit="minutes",
            units_per_amount=30,
            units_per="day",
            units_per_interval=1,
            impact_amount=2.0,
            impact_per="day",
            is_active=True,
        )
        db_session.add(tracker2)
        db_session.commit()

        response = client.get("/dashboard/summary")
        assert response.status_code == 200
        data = response.json()

        # Check overview stats
        assert data["overview"]["total"] >= 2
        assert data["overview"]["active"] >= 2

        # Check category breakdown
        assert len(data["category_breakdown"]) >= 1

        # Check impact rows
        assert len(data["impact_rows"]) >= 2

    def test_get_dashboard_summary_category_breakdown(
        self, client, db_session, sample_tracker
    ):
        """Test dashboard summary includes category breakdown."""
        # Add trackers in different categories
        db_session.add(
            Tracker(
                name="Coding",
                category="Learning",
                type="build",
                start_date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
                unit="hours",
                units_per_amount=2,
                units_per="day",
                units_per_interval=1,
                impact_amount=10.0,
                impact_per="day",
                is_active=True,
            )
        )
        db_session.commit()

        response = client.get("/dashboard/summary")
        assert response.status_code == 200
        data = response.json()

        categories = [cat["category"] for cat in data["category_breakdown"]]
        assert "Learning" in categories

    def test_get_dashboard_summary_top_impact_rows(
        self, client, db_session, sample_tracker, sample_logs
    ):
        """Test dashboard summary includes top impact trackers."""
        # Create multiple trackers with different impact
        for i in range(5):
            db_session.add(
                Tracker(
                    name=f"Tracker {i}",
                    category="Test",
                    type="build",
                    start_date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30),
                    unit="units",
                    units_per_amount=1,
                    units_per="day",
                    units_per_interval=1,
                    impact_amount=float(i + 1),
                    impact_per="day",
                    is_active=True,
                )
            )
        db_session.commit()

        response = client.get("/dashboard/summary")
        assert response.status_code == 200
        data = response.json()

        # Top impact rows should be limited and sorted
        assert len(data["top_impact_rows"]) <= 6
        assert len(data["top_impact_rows"]) > 0

    def test_get_dashboard_summary_inactive_trackers(
        self, client, db_session, sample_tracker
    ):
        """Test dashboard summary filters inactive trackers correctly."""
        # Create an inactive tracker
        db_session.add(
            Tracker(
                name="Inactive",
                category="Test",
                type="build",
                start_date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
                unit="units",
                units_per_amount=1,
                units_per="day",
                units_per_interval=1,
                impact_amount=5.0,
                impact_per="day",
                is_active=False,  # INACTIVE
            )
        )
        db_session.commit()

        response = client.get("/dashboard/summary")
        assert response.status_code == 200
        data = response.json()

        # Active count should be only the active trackers
        assert data["overview"]["active"] >= 1
        assert data["overview"]["paused"] >= 1


class TestTrackerCRUD:
    """Test tracker CRUD operations still work."""

    def test_create_tracker(self, client, db_session):
        """Test creating a new tracker."""
        tracker_data = {
            "name": "New Tracker",
            "category": "Test",
            "type": "build",
            "unit": "pages",
            "units_per_amount": 2,
            "units_per": "day",
            "units_per_interval": 1,
            "impact_amount": 5.0,
            "impact_per": "day",
        }
        response = client.post("/trackers/", json=tracker_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Tracker"
        assert data["type"] == "build"

    def test_get_all_trackers(self, client, sample_tracker, db_session):
        """Test getting all trackers."""
        # Add another tracker
        db_session.add(
            Tracker(
                name="Another",
                category="Test",
                type="quit",
                start_date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
                unit="days",
                units_per_amount=1,
                units_per="day",
                units_per_interval=1,
                impact_amount=0.0,
                impact_per="day",
            )
        )
        db_session.commit()

        response = client.get("/trackers/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_get_single_tracker(self, client, sample_tracker):
        """Test getting a single tracker."""
        response = client.get(f"/trackers/{sample_tracker.id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_tracker.id
        assert data["name"] == sample_tracker.name

    def test_update_tracker(self, client, sample_tracker):
        """Test updating a tracker."""
        update_data = {
            "name": "Updated Name",
            "category": "Updated",
            "type": "build",
            "unit": "pages",
            "units_per_amount": 3,
            "units_per": "day",
            "units_per_interval": 1,
            "impact_amount": 8.0,
            "impact_unit": "$",
            "impact_per": "day",
            "is_active": True,
        }
        response = client.patch(f"/trackers/{sample_tracker.id}/", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["category"] == "Updated"

    def test_delete_tracker(self, client, sample_tracker):
        """Test deleting a tracker."""
        response = client.delete(f"/trackers/{sample_tracker.id}")
        assert response.status_code == 200

        # Verify it's deleted
        response = client.get(f"/trackers/{sample_tracker.id}/")
        assert response.status_code == 404


class TestLogsEndpoints:
    """Test log-related endpoints."""

    def test_create_log(self, client, sample_tracker):
        """Test creating a habit log."""
        response = client.post(
            f"/trackers/{sample_tracker.id}/logs/?timestamp={datetime.utcnow().isoformat()}",
            json={"amount": 5.0},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 5.0

    def test_get_tracker_logs(self, client, sample_tracker, sample_logs):
        """Test getting logs for a tracker."""
        response = client.get(f"/trackers/{sample_tracker.id}/logs")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == len(sample_logs)
        assert all("amount" in log for log in data)

    def test_delete_log(self, client, sample_tracker, sample_logs):
        """Test deleting a log."""
        log_id = sample_logs[0].id
        response = client.delete(f"/trackers/{sample_tracker.id}/logs/{log_id}")
        assert response.status_code == 200

        # Verify it's deleted
        response = client.get(f"/trackers/{sample_tracker.id}/logs")
        data = response.json()
        assert len(data) == len(sample_logs) - 1


class TestJournalEndpoints:
    """Test journal-related endpoints."""

    def test_create_journal_entry(self, client, sample_tracker):
        """Test creating a journal entry."""
        entry_data = {
            "mood": 7,
            "content": "Test entry",
            "is_relapse": False,
            "timestamp": datetime.utcnow().isoformat(),
        }
        response = client.post(f"/trackers/{sample_tracker.id}/journal", json=entry_data)
        assert response.status_code == 200
        data = response.json()
        assert data["mood"] == 7
        assert data["content"] == "Test entry"

    def test_get_tracker_journals(self, client, sample_tracker, sample_journals):
        """Test getting journals for a tracker."""
        response = client.get(f"/trackers/{sample_tracker.id}/journal")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == len(sample_journals)

    def test_delete_journal_entry(self, client, sample_tracker, sample_journals):
        """Test deleting a journal entry."""
        entry_id = sample_journals[0].id
        response = client.delete(f"/trackers/{sample_tracker.id}/journal/{entry_id}")
        assert response.status_code == 200

        # Verify it's deleted
        response = client.get(f"/trackers/{sample_tracker.id}/journal")
        data = response.json()
        assert len(data) == len(sample_journals) - 1
