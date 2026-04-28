# AnyHabit Backend Quick Reference

## Quick API Cheat Sheet

### Base URL
```
http://localhost:8000/api
```

### Fast Setup

```bash
# All endpoints are live at
http://localhost:8000/docs  # Interactive API docs
http://localhost:8000/redoc # ReDoc documentation
```

---

## Essential Endpoints

### Authentication

```bash
# Register
POST /auth/register
{
  "username": "sam",
  "email": "sam@example.com",
  "password": "secret123"
}

# Login
POST /auth/login
{
  "identifier": "sam@example.com",
  "password": "secret123"
}

# Current user
GET /auth/me
```

### Groups

```bash
# Create group
POST /groups/
{"name": "Family"}

# Join group
POST /groups/join
{"join_code": "AB12CD34"}

# List groups
GET /groups/
```

All tracker, log, journal, and dashboard routes require `Authorization: Bearer <token>`.


### Trackers

```bash
# Create tracker
POST /trackers/
{
  "name": "Reading",
  "type": "build",
  "unit": "pages",
  "units_per_amount": 2,
  "units_per": "day",
  "impact_amount": 5,
  "group_id": 3,
  "participant_ids": [2, 4]
}

# Get all
GET /trackers/

# Get full tracker data (recommended)
GET /trackers/{id}/bundle

# Get analytics only
GET /trackers/{id}/analytics

# Update
PATCH /trackers/{id}/

# Start/Stop
PUT /trackers/{id}/start
PUT /trackers/{id}/stop

# Reset (logs relapse)
POST /trackers/{id}/reset

# Delete
DELETE /trackers/{id}
```

### Logs

```bash
# Create (add query param: ?timestamp=2024-03-15T10:30:00)
POST /trackers/{id}/logs
{"amount": 45}

# Get all
GET /trackers/{id}/logs

# Delete
DELETE /trackers/{id}/logs/{log_id}
```

### Journals

```bash
# Create
POST /trackers/{id}/journal
{
  "mood": 8,
  "content": "Great session!",
  "is_relapse": false
}

# Get all
GET /trackers/{id}/journal

# Update
PUT /trackers/{id}/journal/{journal_id}

# Delete
DELETE /trackers/{id}/journal/{journal_id}
```

### Dashboard

```bash
# Summary stats
GET /dashboard/summary

# Home layout
GET /dashboard/home
PUT /dashboard/home
```

---

## Data Models

### Tracker Types
- `build` - Positive habit (read 30 pages, exercise 30 min)
- `quit` - Stop bad habit (days without smoking)
- `boolean` - Did it today? (meditation, drink water)

### Impact Periods
`day`, `week`, `month`, `year`

---

## Common Patterns

### Create tracker + log activity

```javascript
// 1. Create tracker
const tracker = await fetch('/api/trackers/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Morning Run',
    type: 'build',
    unit: 'minutes',
    units_per_amount: 30,
    units_per: 'day',
    impact_amount: 2
  })
}).then(r => r.json());

// 2. Log activity
const log = await fetch(
  `/api/trackers/${tracker.id}/logs?timestamp=${new Date().toISOString()}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 30 })
  }
).then(r => r.json());

// 3. Add journal entry
const journal = await fetch(`/api/trackers/${tracker.id}/journal`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mood: 9,
    content: 'Completed 30-minute run!'
  })
}).then(r => r.json());
```

### Get complete tracker view

```javascript
const data = await fetch(`/api/trackers/1/bundle`).then(r => r.json());

// Access everything
console.log(data.tracker);           // Basic info
console.log(data.habit_logs);        // All logs
console.log(data.journal_entries);   // All journals
console.log(data.analytics);         // Computed stats
  .current_math.impact_value        // Money value
  .daily_progress.percentage        // Progress %
  .streak_stats.current             // Days streak
  .historical_chart_data            // 120-day history
  .build_heatmap                    // Contribution grid
```

### Build a dashboard

```javascript
const dashboard = await fetch('/api/dashboard/summary').then(r => r.json());

console.log(dashboard.overview);          // Stats: total, active, by_type
console.log(dashboard.category_breakdown); // Grouped by category
console.log(dashboard.impact_rows);       // All impact data
console.log(dashboard.top_impact_rows);   // Top 6 trackers
```

---

## Response Examples

### Tracker Bundle
```json
{
  "tracker": { id, name, type, unit, ... },
  "habit_logs": [ { id, amount, timestamp, ... }, ... ],
  "journal_entries": [ { id, mood, content, ... }, ... ],
  "analytics": {
    "current_math": { main_unit, target_unit, impact_value },
    "daily_progress": { total, target, percentage },
    "streak_stats": { current, longest, period_label },
    "historical_chart_data": [ { date, label, value, cumulative }, ... ],
    "build_heatmap": { columns, max_amount }
  }
}
```

### Dashboard Summary
```json
{
  "overview": {
    "total": 5,
    "active": 4,
    "paused": 1,
    "categories": 3,
    "by_type": { "build": 3, "quit": 2 }
  },
  "category_breakdown": [
    { "category": "Learning", "count": 3 }
  ],
  "impact_rows": [
    { "tracker": {...}, "main_amount": 95, "impact_value": 23.75, ... }
  ],
  "top_impact_rows": [ ... ]
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid data) |
| 404 | Not found (tracker/log doesn't exist) |
| 500 | Server error |

---

## Development Tips

1. **Use bundle endpoint** when building tracker views (gets everything in one request)
2. **Use analytics endpoint** to get pre-computed stats (don't derive in frontend)
3. **Use dashboard/summary** for dashboard views (all aggregated data)
4. **Always include timestamp** in log queries as a URL parameter
5. **Check response status** before accessing data

---

## Common Issues

**404 Tracker not found**
- Verify tracker ID exists: `GET /trackers/`
- Check tracker is not deleted

**Invalid datetime format**
- Use ISO 8601: `2024-03-15T10:30:00`
- Correct: `2024-03-15T10:30:00`
- Wrong: `03/15/2024` or `March 15, 2024`

**Timestamp query parameter missing**
- When creating logs, include: `?timestamp=2024-03-15T10:30:00`

---

## See Also

- **Full Documentation:** [README.md](./README.md)
- **Code Structure:** Files in this directory
- **Models:** [models.py](./models.py)
- **Schemas:** [schemas.py](./schemas.py)

