# Backend Development Guide

This guide explains the backend code structure and how to develop/extend the API.

## Project Structure

```
backend/
├── __pycache__/                 # Python cache (ignore)
├── data/                        # SQLite database (local dev only)
├── routers/                     # API endpoint definitions
│   ├── __init__.py
│   ├── trackers.py             # /trackers endpoints
│   ├── logs.py                 # /logs endpoints
│   ├── journals.py             # /journal endpoints
│   └── dashboard.py            # /dashboard endpoints
├── analytics.py                # Business logic (calculations)
├── database.py                 # Database connection
├── deps.py                     # Dependency injection
├── main.py                     # Application entry point
├── migrations.py               # Database migrations
├── models.py                   # SQLAlchemy ORM models
├── schemas.py                  # Pydantic request/response schemas
├── time_utils.py              # Date/time utilities
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Container definition
├── README.md                   # API documentation
├── API_QUICK_REFERENCE.md      # Quick API cheat sheet
├── FRONTEND_INTEGRATION.md     # Frontend dev guide
└── INDEX.md                    # Documentation index
```

## Core Components

### 1. Database (database.py)

Manages SQLAlchemy ORM setup:

```python
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

- SQLite in dev, PostgreSQL recommended for production
- Connection pooling
- Session management

### 2. Models (models.py)

SQLAlchemy ORM definitions:

```python
class Tracker(Base):
    """Represents a habit/goal tracker"""
    id = Column(Integer, primary_key=True)
    name = Column(String)
    type = Column(String)  # "build", "quit", "boolean"
    # ... other fields

class HabitLog(Base):
    """Activity log for a tracker"""
    id = Column(Integer, primary_key=True)
    tracker_id = Column(ForeignKey("trackers.id"))
    amount = Column(Float)
    timestamp = Column(DateTime)
```

**Key Points:**
- Uses UTC-naive datetimes
- Foreign keys for relationships
- Cascade deletes on tracker deletion

### 3. Schemas (schemas.py)

Pydantic models for request/response validation:

```python
class Tracker(BaseModel):
    """Response schema for trackers"""
    id: int
    name: str
    type: str
    # ...

class TrackerCreate(BaseModel):
    """Request schema for creating trackers"""
    name: str
    type: str
    # ...
```

**Key Points:**
- Validates input data
- Converts database models to JSON
- Separates concerns (DB vs API)

### 4. Analytics (analytics.py)

Business logic and calculations:

```python
def build_tracker_analytics(tracker, logs, journals):
    """Compute all metrics for a tracker"""
    current_math = _calculate_current_math(tracker, logs)
    daily_progress = _calculate_daily_progress(tracker, logs)
    streaks = _calculate_streak_stats(tracker, logs, journals)
    # ... more calculations
    return TrackerAnalytics(...)
```

**Key Functions:**
- `period_start()` - Get start of a period
- `add_period()` - Move forward in time
- `shift_period()` - Move multiple periods
- `get_periods_between()` - Calculate duration
- `_calculate_current_math()` - Current progress
- `_calculate_daily_progress()` - Today's progress
- `_calculate_streak_stats()` - Streak counts
- `_build_historical_chart_data()` - 120-day history
- `_build_heatmap()` - GitHub-style heatmap
- `build_dashboard_summary()` - Aggregate all trackers

### 5. Routers (routers/)

FastAPI endpoints:

```python
@router.get("/trackers/")
def read_trackers(db: Session = Depends(get_db)):
    return db.query(models.Tracker).all()

@router.post("/trackers/")
def create_tracker(tracker: schemas.TrackerCreate, db: Session = Depends(get_db)):
    db_tracker = models.Tracker(**tracker.dict())
    db.add(db_tracker)
    db.commit()
    return db_tracker
```

**Organization:**
- One file per resource
- Grouped by operation (POST, GET, PUT, DELETE)
- Error handling with HTTPException

### 6. Dependencies (deps.py)

Dependency injection:

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Used in endpoints: `db: Session = Depends(get_db)`

### 7. Application (main.py)

FastAPI app setup:

```python
app = FastAPI(title="AnyHabit API")

# CORS configuration
app.add_middleware(CORSMiddleware, ...)

# Routes
app.include_router(trackers_router)
app.include_router(logs_router)
```

---

## How to Add a New Endpoint

### Step 1: Update Schema

In `schemas.py`:

```python
class MyResourceBase(BaseModel):
    name: str
    value: int

class MyResourceCreate(MyResourceBase):
    pass

class MyResource(MyResourceBase):
    id: int
    class Config:
        from_attributes = True
```

### Step 2: Update Model

In `models.py`:

```python
class MyResource(Base):
    __tablename__ = "my_resources"
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    value = Column(Integer)
```

### Step 3: Run Migrations

In `migrations.py`:

```python
def run_startup_migrations():
    # Add your migration logic
    pass
```

### Step 4: Create Route

In `routers/my_resource.py`:

```python
@router.post("/", response_model=schemas.MyResource)
def create_my_resource(resource: schemas.MyResourceCreate, db: Session = Depends(get_db)):
    db_resource = models.MyResource(**resource.dict())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

@router.get("/", response_model=list[schemas.MyResource])
def read_my_resources(db: Session = Depends(get_db)):
    return db.query(models.MyResource).all()
```

### Step 5: Register Router

In `main.py`:

```python
from .routers import my_resource_router

app.include_router(my_resource_router)
```

### Step 6: Update Documentation

Add the new endpoint details to the relevant README or quick reference so the API docs stay aligned with the code.

---

## Data Flow

### Creating a Tracker

```
1. Frontend sends: POST /trackers/
   {
     "name": "Reading",
     "type": "build",
     "units_per_amount": 2,
     "units_per": "day",
     ...
   }

2. Fastapi validates with TrackerCreate schema
3. Route handler (routers/trackers.py) creates model
4. Model stored in SQLite database
5. Model converted back to Tracker schema
6. JSON response sent to frontend
```

### Getting Tracker with Analytics

```
1. Frontend sends: GET /trackers/1/bundle
2. Route fetches tracker from database
3. Route fetches logs: HabitLog records
4. Route fetches journals: JournalEntry records
5. analytics.py computes all metrics:
   - Current progress
   - Daily progress
   - Streaks
   - Charts
   - Heatmap
6. TrackerBundle schema combines all data
7. JSON response sent to frontend
```

---

## Error Handling

### In Routes

```python
@router.get("/{tracker_id}/")
def read_tracker(tracker_id: int, db: Session = Depends(get_db)):
    tracker = db.query(models.Tracker).filter(models.Tracker.id == tracker_id).first()
    
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker not found")
    
    return tracker
```

### Response

```json
{
  "detail": "Tracker not found"
}
```

### Common Patterns

```python
# Not found
raise HTTPException(status_code=404, detail="Resource not found")

# Validation error
raise HTTPException(status_code=400, detail="Invalid data")

# Server error
raise HTTPException(status_code=500, detail="Internal server error")
```

---

## Performance Considerations

### Database Queries

**Avoid N+1 queries:**

```python
# ✗ Bad: Creates N+1 queries
trackers = db.query(models.Tracker).all()
for tracker in trackers:
    logs = db.query(models.HabitLog).filter(...).all()

# ✓ Good: Single query
trackers = db.query(models.Tracker).all()
logs = db.query(models.HabitLog).all()  # Fetch all at once
```

### Analytics Caching

```python
# Current: Computed on each request
GET /trackers/1/analytics  # Calculates every time

# Future optimization: Cache results
# Could add Redis/memcached
```

### Date Math

The analytics module includes optimized date calculations:

```python
# Handles edge cases like Feb 31st
shift_period(datetime(2024, 1, 31), "month", 1)
# Returns: datetime(2024, 2, 29)  # Feb has 29 days in leap year
```

---

## Database Schema

### Trackers Table

```
tracker_id (int) PRIMARY KEY
name (string)
category (string)
type (string) - "build", "quit", "boolean"
start_date (datetime)
current_streak_start_date (datetime)
unit (string)
units_per_amount (float)
units_per (string) - "day", "week", "month", "year"
units_per_interval (int)
impact_amount (float)
impact_per (string)
impact_unit (string)
is_active (boolean)
```

### HabitLog Table

```
log_id (int) PRIMARY KEY
tracker_id (int) FOREIGN KEY
timestamp (datetime)
amount (float)
```

### JournalEntry Table

```
entry_id (int) PRIMARY KEY
tracker_id (int) FOREIGN KEY
timestamp (datetime)
mood (int) - 1-10
content (string)
is_relapse (boolean)
```

### DashboardState Table

```
state_id (int) PRIMARY KEY
name (string) - "home"
widgets_json (string) - JSON
layouts_json (string) - JSON
updated_at (datetime)
```

---

## Advanced Topics

### Custom Tracker Types

To add a new tracker type (e.g., "hybrid"):

1. Update `schemas.py` to document the type
2. Update `analytics.py` calculation logic:
   ```python
   if tracker.type == "hybrid":
       # Custom calculation
   ```
3. Document in README

### Time Zone Support

Currently uses UTC-naive datetime. To add timezone support:

1. Store timezone in Tracker model
2. Convert on storage/retrieval
3. Update analytics calculations
4. Update documentation

### Real-Time Updates

For WebSocket support:

1. Add WebSocket route in FastAPI
2. Emit events on data changes
3. Frontend connects to stream
4. Real-time updates without polling

---

## Debugging

### Enable Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Interactive Shell

```bash
python -c "
from backend.database import SessionLocal
from backend import models

db = SessionLocal()
trackers = db.query(models.Tracker).all()
print(trackers)
"
```

### Database Inspection

```bash
sqlite3 data/anyhabit.db
sqlite> .tables
sqlite> SELECT * FROM trackers;
```

## Deployment

### Docker

```bash
# Build
docker build -t anyhabit-backend .

# Run
docker run -p 8000:8000 anyhabit-backend
```

### Production Checklist

- [ ] Use PostgreSQL (not SQLite)
- [ ] Set secure CORS origins
- [ ] Add authentication
- [ ] Enable rate limiting
- [ ] Add API versioning
- [ ] Database backups
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring

---

## Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **SQLAlchemy Docs:** https://docs.sqlalchemy.org/
- **Pydantic Docs:** https://docs.pydantic.dev/
- **API Documentation:** [README.md](./README.md)

---

## Contributing

When contributing:

1. Follow the existing code style
2. Update documentation
3. Check with `pylint` or `black` (optional)

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.

---

**Last Updated:** March 2024  
**Version:** 1.0  
**Maintainers:** [AnyHabit Team](https://github.com/Sparths/AnyHabit)
