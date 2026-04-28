from sqlalchemy import text

from .database import engine
from .security import BOOTSTRAP_EMAIL, BOOTSTRAP_PASSWORD, BOOTSTRAP_USERNAME, hash_password


def _table_exists(connection, table_name: str) -> bool:
    return (
        connection.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name = :table_name"),
            {"table_name": table_name},
        ).first()
        is not None
    )


def _get_user_id(connection, email: str) -> int | None:
    row = connection.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email}).first()
    return int(row[0]) if row else None


def ensure_group_tables():
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS groups ("
                "id INTEGER PRIMARY KEY, "
                "name VARCHAR NOT NULL, "
                "join_code VARCHAR NOT NULL UNIQUE, "
                "owner_id INTEGER, "
                "created_at DATETIME"
                ")"
            )
        )
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS group_members ("
                "id INTEGER PRIMARY KEY, "
                "group_id INTEGER, "
                "user_id INTEGER, "
                "role VARCHAR DEFAULT 'member', "
                "joined_at DATETIME, "
                "UNIQUE(group_id, user_id)"
                ")"
            )
        )
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS tracker_participants ("
                "id INTEGER PRIMARY KEY, "
                "tracker_id INTEGER, "
                "user_id INTEGER, "
                "role VARCHAR DEFAULT 'participant', "
                "added_at DATETIME, "
                "UNIQUE(tracker_id, user_id)"
                ")"
            )
        )


def ensure_users_table_seed():
    with engine.begin() as connection:
        if not _table_exists(connection, "users"):
            return

        existing_user = connection.execute(text("SELECT id FROM users LIMIT 1")).first()
        if existing_user is not None:
            return

        connection.execute(
            text(
                "INSERT INTO users (username, email, password_hash, created_at, is_active) "
                "VALUES (:username, :email, :password_hash, CURRENT_TIMESTAMP, 1)"
            ),
            {
                "username": BOOTSTRAP_USERNAME,
                "email": BOOTSTRAP_EMAIL,
                "password_hash": hash_password(BOOTSTRAP_PASSWORD),
            },
        )


def ensure_tracker_category_column():
    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(trackers)"))
        column_names = {row[1] for row in columns}
        if "category" not in column_names:
            connection.execute(text("ALTER TABLE trackers ADD COLUMN category VARCHAR DEFAULT 'General'"))


def ensure_tracker_impact_columns():
    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(trackers)"))
        column_names = {row[1] for row in columns}

        if "impact_amount" not in column_names:
            connection.execute(text("ALTER TABLE trackers ADD COLUMN impact_amount FLOAT DEFAULT 0.0"))
        if "impact_unit" not in column_names:
            connection.execute(text("ALTER TABLE trackers ADD COLUMN impact_unit VARCHAR DEFAULT '$'"))
        if "impact_per" not in column_names:
            connection.execute(text("ALTER TABLE trackers ADD COLUMN impact_per VARCHAR DEFAULT 'day'"))

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


def ensure_tracker_ownership_columns():
    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(trackers)"))
        column_names = {row[1] for row in columns}

        if "owner_id" not in column_names:
            connection.execute(text("ALTER TABLE trackers ADD COLUMN owner_id INTEGER"))
        if "group_id" not in column_names:
            connection.execute(text("ALTER TABLE trackers ADD COLUMN group_id INTEGER"))
        if "visibility" not in column_names:
            connection.execute(text("ALTER TABLE trackers ADD COLUMN visibility VARCHAR DEFAULT 'private'"))


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
            connection.execute(text("ALTER TABLE trackers ADD COLUMN units_per_interval INTEGER DEFAULT 1"))

        connection.execute(
            text(
                "UPDATE trackers "
                "SET units_per_interval = 1 "
                "WHERE units_per_interval IS NULL OR units_per_interval < 1"
            )
        )


def ensure_activity_user_columns():
    with engine.begin() as connection:
        journal_columns = connection.execute(text("PRAGMA table_info(journal_entries)"))
        journal_column_names = {row[1] for row in journal_columns}
        if "user_id" not in journal_column_names:
            connection.execute(text("ALTER TABLE journal_entries ADD COLUMN user_id INTEGER"))

        log_columns = connection.execute(text("PRAGMA table_info(habit_logs)"))
        log_column_names = {row[1] for row in log_columns}
        if "user_id" not in log_column_names:
            connection.execute(text("ALTER TABLE habit_logs ADD COLUMN user_id INTEGER"))


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


def ensure_dashboard_state_table():
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS user_dashboard_states ("
                "id INTEGER PRIMARY KEY, "
                "user_id INTEGER, "
                "name VARCHAR DEFAULT 'home', "
                "widgets_json TEXT DEFAULT '[]', "
                "layouts_json TEXT DEFAULT '{}', "
                "updated_at DATETIME, "
                "UNIQUE(user_id, name)"
                ")"
            )
        )


def ensure_bootstrap_ownership():
    with engine.begin() as connection:
        if not _table_exists(connection, "users"):
            return

        bootstrap_user_id = _get_user_id(connection, BOOTSTRAP_EMAIL)
        if bootstrap_user_id is None:
            return

        connection.execute(
            text("UPDATE trackers SET owner_id = COALESCE(owner_id, :user_id), visibility = COALESCE(visibility, 'private')"),
            {"user_id": bootstrap_user_id},
        )
        connection.execute(text("UPDATE journal_entries SET user_id = COALESCE(user_id, :user_id)"), {"user_id": bootstrap_user_id})
        connection.execute(text("UPDATE habit_logs SET user_id = COALESCE(user_id, :user_id)"), {"user_id": bootstrap_user_id})
        connection.execute(
            text(
                "INSERT OR IGNORE INTO tracker_participants (tracker_id, user_id, role, added_at) "
                "SELECT id, :user_id, 'owner', CURRENT_TIMESTAMP FROM trackers"
            ),
            {"user_id": bootstrap_user_id},
        )


def seed_dashboard_state_from_legacy():
    with engine.begin() as connection:
        if not _table_exists(connection, "dashboard_states"):
            return

        bootstrap_user_id = _get_user_id(connection, BOOTSTRAP_EMAIL)
        if bootstrap_user_id is None:
            return

        existing_state = connection.execute(
            text("SELECT widgets_json, layouts_json, updated_at FROM dashboard_states WHERE name = 'home' LIMIT 1")
        ).first()
        if existing_state is None:
            return

        connection.execute(
            text(
                "INSERT OR IGNORE INTO user_dashboard_states (user_id, name, widgets_json, layouts_json, updated_at) "
                "VALUES (:user_id, 'home', :widgets_json, :layouts_json, :updated_at)"
            ),
            {
                "user_id": bootstrap_user_id,
                "widgets_json": existing_state[0],
                "layouts_json": existing_state[1],
                "updated_at": existing_state[2],
            },
        )


def ensure_home_dashboard_state():
    with engine.begin() as connection:
        bootstrap_user_id = _get_user_id(connection, BOOTSTRAP_EMAIL)
        if bootstrap_user_id is None:
            return

        connection.execute(
            text(
                "INSERT OR IGNORE INTO user_dashboard_states (user_id, name, widgets_json, layouts_json, updated_at) "
                "VALUES (:user_id, 'home', '[]', '{}', CURRENT_TIMESTAMP)"
            ),
            {"user_id": bootstrap_user_id},
        )


def run_startup_migrations():
    ensure_group_tables()
    ensure_users_table_seed()
    ensure_tracker_category_column()
    ensure_tracker_impact_columns()
    ensure_tracker_ownership_columns()
    ensure_tracker_streak_column()
    ensure_tracker_units_per_interval_column()
    ensure_activity_user_columns()
    ensure_journal_relapse_column()
    ensure_dashboard_state_table()
    ensure_bootstrap_ownership()
    seed_dashboard_state_from_legacy()
    ensure_home_dashboard_state()
