from sqlalchemy import text

from .database import engine


def ensure_tracker_category_column():
    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(trackers)"))
        column_names = {row[1] for row in columns}
        if "category" not in column_names:
            connection.execute(
                text("ALTER TABLE trackers ADD COLUMN category VARCHAR DEFAULT 'General'")
            )


def ensure_tracker_impact_columns():
    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(trackers)"))
        column_names = {row[1] for row in columns}

        if "impact_amount" not in column_names:
            connection.execute(
                text("ALTER TABLE trackers ADD COLUMN impact_amount FLOAT DEFAULT 0.0")
            )
        if "impact_unit" not in column_names:
            connection.execute(
                text("ALTER TABLE trackers ADD COLUMN impact_unit VARCHAR DEFAULT '$'")
            )
        if "impact_per" not in column_names:
            connection.execute(
                text("ALTER TABLE trackers ADD COLUMN impact_per VARCHAR DEFAULT 'day'")
            )

        if "money_saved_amount" in column_names:
            connection.execute(
                text(
                    "UPDATE trackers SET impact_amount = COALESCE(money_saved_amount, 0.0) "
                    "WHERE impact_amount IS NULL OR impact_amount = 0.0"
                )
            )
        if "money_saved_per" in column_names:
            connection.execute(
                text(
                    "UPDATE trackers SET impact_per = COALESCE(money_saved_per, 'day') "
                    "WHERE impact_per IS NULL OR impact_per = ''"
                )
            )


def ensure_tracker_streak_column():
    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(trackers)"))
        column_names = {row[1] for row in columns}

        if "current_streak_start_date" not in column_names:
            connection.execute(text("ALTER TABLE trackers ADD COLUMN current_streak_start_date DATETIME"))

        connection.execute(
            text(
                "UPDATE trackers "
                "SET current_streak_start_date = start_date "
                "WHERE current_streak_start_date IS NULL"
            )
        )


def ensure_tracker_units_per_interval_column():
    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(trackers)"))
        column_names = {row[1] for row in columns}

        if "units_per_interval" not in column_names:
            connection.execute(
                text("ALTER TABLE trackers ADD COLUMN units_per_interval INTEGER DEFAULT 1")
            )

        connection.execute(
            text(
                "UPDATE trackers "
                "SET units_per_interval = 1 "
                "WHERE units_per_interval IS NULL OR units_per_interval < 1"
            )
        )


def ensure_journal_relapse_column():
    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(journal_entries)"))
        column_names = {row[1] for row in columns}

        if "is_relapse" not in column_names:
            connection.execute(text("ALTER TABLE journal_entries ADD COLUMN is_relapse BOOLEAN DEFAULT 0"))

        connection.execute(
            text(
                "UPDATE journal_entries "
                "SET is_relapse = 1 "
                "WHERE (is_relapse IS NULL OR is_relapse = 0) "
                "AND content = 'Logged a relapse. Timer was reset to zero.'"
            )
        )


def run_startup_migrations():
    ensure_tracker_category_column()
    ensure_tracker_impact_columns()
    ensure_tracker_streak_column()
    ensure_tracker_units_per_interval_column()
    ensure_journal_relapse_column()
