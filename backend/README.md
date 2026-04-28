# AnyHabit Backend API Documentation

Welcome to the AnyHabit API! This document provides comprehensive information about all available endpoints, request formats, and response schemas.

## Table of Contents

- [Getting Started](#getting-started)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Authentication](#authentication)
- [Data Types](#data-types)
- [Endpoints](#endpoints)
  - [Auth](#auth)
  - [Groups](#groups)
  - [Trackers](#trackers)
  - [Logs](#logs)
  - [Journals](#journals)
  - [Dashboard](#dashboard)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Prerequisites

- FastAPI server running (default: `http://localhost:8000`)
- Any HTTP client (curl, Postman, JavaScript fetch, etc.)

### Quick Test

Test the API is running:

```bash
curl http://localhost:8000/
# Response: {"message": "Welcome to AnyHabit! The Server is running."}
```

### View Interactive Documentation

FastAPI provides interactive API docs:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Base URL

```
http://localhost:8000/api
```

All endpoints are prefixed with `/api`. Replace `localhost:8000` with your server's actual address.

---

## Authentication

AnyHabit now uses signed JWT sessions with a secure HttpOnly cookie by default. Register or log in through `/auth`; the backend sets an auth cookie automatically, and subsequent browser requests authenticate via `credentials: "include"`.

For non-browser clients, you can still use bearer auth by passing the returned `access_token` as `Authorization: Bearer <token>`.

The backend seeds a local bootstrap account on first run using these environment variables:
- `ANYHABIT_BOOTSTRAP_USERNAME`
- `ANYHABIT_BOOTSTRAP_EMAIL`
- `ANYHABIT_BOOTSTRAP_PASSWORD`
- `ANYHABIT_SECRET_KEY`
- `ANYHABIT_CORS_ORIGINS`
- `ANYHABIT_COOKIE_SECURE`
- `ANYHABIT_COOKIE_SAMESITE`
- `ANYHABIT_COOKIE_DOMAIN`

---

## Data Types


### Auth

#### Register

`POST /auth/register`

```json
{
  "username": "sam",
  "email": "sam@example.com",
  "password": "secret123"
}
```

#### Login

`POST /auth/login`

```json
{
  "identifier": "sam@example.com",
  "password": "secret123"
}
```

### Groups

- `POST /groups/` creates a group and adds the owner automatically.
- `POST /groups/join` joins a group using its join code.
- `GET /groups/` lists all groups the current user belongs to.
- `GET /groups/{group_id}` returns members and the join code.

### Tracker Types

Three types of trackers for different use cases:

| Type | Use Case | Example |
|------|----------|---------|
| `build` | Build positive habits | Reading 30 pages/day, Exercise 30 min/day |
| `quit` | Quit harmful habits | Days without smoking, No junk food |
| `boolean` | Track completion (yes/no) | Meditated today, Drank water |

### Impact Types

Specify frequency for impact calculation:

- `day` - Daily impact
- `week` - Weekly impact
- `month` - Monthly impact
- `year` - Yearly impact

### Date Format

All dates use ISO 8601 format:
```
2024-03-15T10:30:00Z
```

Timestamps are stored and processed as UTC timezone-aware values.

---

## Endpoints

### Trackers

Manage habit trackers.

#### Create Tracker

**Endpoint:** `POST /trackers/`

**Description:** Create a new tracker. If `group_id` is set, the tracker becomes shared and `participant_ids` selects the members assigned to it.

**Request Body:**

```json
{
  "name": "Reading",
  "category": "Learning",
  "type": "build",
  "unit": "pages",
  "units_per_amount": 2,
  "units_per": "day",
  "units_per_interval": 1,
  "impact_amount": 5.0,
  "impact_per": "day",
  "impact_unit": "$",
  "start_date": "2024-03-01T00:00:00",
  "is_active": true,
  "group_id": 3,
  "participant_ids": [2, 4]
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "Reading",
  "category": "Learning",
  "type": "build",
  "start_date": "2024-03-01T00:00:00",
  "current_streak_start_date": "2024-03-01T00:00:00",
  "unit": "pages",
  "units_per_amount": 2,
  "units_per": "day",
  "units_per_interval": 1,
  "impact_amount": 5.0,
  "impact_per": "day",
  "impact_unit": "$",
  "is_active": true
}
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Tracker name |
| category | string | No | "General" | Category for grouping |
| type | string | Yes | - | "build", "quit", or "boolean" |
| unit | string | Yes | - | Unit being tracked (e.g., "pages", "minutes") |
| units_per_amount | float | No | 0 | Amount in each interval |
| units_per | string | No | "day" | Interval period |
| units_per_interval | int | No | 1 | Number of intervals (≥1) |
| impact_amount | float | No | 0 | Value gained/lost per impact period |
| impact_per | string | No | "day" | Impact period |
| impact_unit | string | No | "$" | Unit of impact (optional badge) |
| start_date | datetime | No | Now | Tracker start date |
| is_active | bool | No | true | Whether tracker is active |
| group_id | int | No | null | Group to share the tracker with |
| participant_ids | array[int] | No | [] | Assigned members inside the group |

---

#### Get All Trackers

**Endpoint:** `GET /trackers/`

**Description:** Retrieve all trackers

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Reading",
    "category": "Learning",
    "type": "build",
    "start_date": "2024-03-01T00:00:00",
    "current_streak_start_date": "2024-03-01T00:00:00",
    "unit": "pages",
    "units_per_amount": 2,
    "units_per": "day",
    "units_per_interval": 1,
    "impact_amount": 5.0,
    "impact_per": "day",
    "impact_unit": "$",
    "is_active": true
  }
]
```

---

#### Get Tracker with Complete Data

**Endpoint:** `GET /trackers/{tracker_id}/bundle`

**Description:** Get tracker, logs, journals, and analytics in one response

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| tracker_id | integer | Tracker ID |

**Response (200 OK):**

```json
{
  "tracker": {
    "id": 1,
    "name": "Reading",
    "category": "Learning",
    "type": "build",
    "unit": "pages",
    "units_per_amount": 2,
    "units_per": "day",
    "units_per_interval": 1,
    "impact_amount": 5.0,
    "impact_per": "day",
    "impact_unit": "$",
    "start_date": "2024-03-01T00:00:00",
    "current_streak_start_date": "2024-03-05T00:00:00",
    "is_active": true
  },
  "habit_logs": [
    {
      "id": 1,
      "tracker_id": 1,
      "timestamp": "2024-03-15T00:00:00",
      "amount": 45.0
    },
    {
      "id": 2,
      "tracker_id": 1,
      "timestamp": "2024-03-14T00:00:00",
      "amount": 50.0
    }
  ],
  "journal_entries": [
    {
      "id": 1,
      "tracker_id": 1,
      "timestamp": "2024-03-15T10:30:00",
      "mood": 8,
      "content": "Great reading session!",
      "is_relapse": false
    }
  ],
  "analytics": {
    "current_math": {
      "main_unit": 95.0,
      "target_unit": 100.0,
      "impact_value": 23.75
    },
    "daily_progress": {
      "total": 95.0,
      "target": 100.0,
      "percentage": 95.0
    },
    "historical_chart_data": [
      {
        "date": "2024-03-13",
        "label": "Mar 13",
        "value": 40.0,
        "cumulative": 40.0
      },
      {
        "date": "2024-03-14",
        "label": "Mar 14",
        "value": 50.0,
        "cumulative": 90.0
      },
      {
        "date": "2024-03-15",
        "label": "Mar 15",
        "value": 45.0,
        "cumulative": 135.0
      }
    ],
    "streak_stats": {
      "current": 5,
      "longest": 12,
      "period_label": "days"
    },
    "build_heatmap": {
      "columns": [
        [
          {
            "date": "2024-03-03",
            "amount": 0,
            "is_filler": true
          },
          {
            "date": "2024-03-10",
            "amount": 45.0,
            "is_filler": false
          }
        ]
      ],
      "max_amount": 50.0
    }
  }
}
```

**Response Notes:**
- Contains complete tracker state with all related data
- `analytics` includes computations like progress, streaks, and heatmaps
- Use this endpoint when building a tracker detail view

---

#### Get Tracker Analytics

**Endpoint:** `GET /trackers/{tracker_id}/analytics`

**Description:** Get computed analytics for a tracker (progress, streaks, charts)

**Response (200 OK):**

```json
{
  "current_math": {
    "main_unit": 95.0,
    "target_unit": 100.0,
    "impact_value": 23.75
  },
  "daily_progress": {
    "total": 95.0,
    "target": 100.0,
    "percentage": 95.0
  },
  "historical_chart_data": [
    {
      "date": "2024-03-13",
      "label": "Mar 13",
      "value": 40.0,
      "cumulative": 40.0
    },
    {
      "date": "2024-03-14",
      "label": "Mar 14",
      "value": 50.0,
      "cumulative": 90.0
    }
  ],
  "streak_stats": {
    "current": 5,
    "longest": 12,
    "period_label": "days"
  },
  "build_heatmap": {
    "columns": [
      [
        {
          "date": "2024-03-03",
          "amount": 0,
          "is_filler": true
        },
        {
          "date": "2024-03-10",
          "amount": 45.0,
          "is_filler": false
        }
      ]
    ],
    "max_amount": 50.0
  }
}
```

**Analytics Fields:**

- **current_math**: Today's progress
  - `main_unit`: Total units logged
  - `target_unit`: Expected target for the period
  - `impact_value`: Monetary value gained
  
- **daily_progress**: Progress within current window
  - `total`: Total logged in current window
  - `target`: Target for this window
  - `percentage`: Completion percentage (0-100)
  
- **streak_stats**: Consecutive days/windows
  - `current`: Current streak length
  - `longest`: All-time longest streak
  - `period_label`: Period type ("days", "weeks", etc.)
  
- **historical_chart_data**: 120-day historical data for charts
  
- **build_heatmap**: GitHub-style contribution heatmap for 24 weeks

---

#### Update Tracker

**Endpoint:** `PATCH /trackers/{tracker_id}/`

**Description:** Update tracker settings

**Request Body:**

```json
{
  "name": "Reading",
  "category": "Learning",
  "type": "build",
  "unit": "pages",
  "units_per_amount": 3,
  "units_per": "day",
  "units_per_interval": 1,
  "impact_amount": 8.0,
  "impact_per": "day",
  "impact_unit": "$",
  "is_active": true
}
```

**Response (200 OK):** Updated tracker object

---

#### Start Tracker

**Endpoint:** `PUT /trackers/{tracker_id}/start`

**Description:** Reactivate a paused tracker

**Response (200 OK):** Updated tracker with `is_active: true`

---

#### Stop Tracker

**Endpoint:** `PUT /trackers/{tracker_id}/stop`

**Description:** Pause a tracker

**Response (200 OK):** Updated tracker with `is_active: false`

---

#### Reset Tracker

**Endpoint:** `POST /trackers/{tracker_id}/reset`

**Description:** Reset streak to zero (logs relapse)

**Response (200 OK):** Updated tracker

**Side Effects:**
- Sets `current_streak_start_date` to now
- Creates journal entry with `is_relapse: true`

---

#### Delete Tracker

**Endpoint:** `DELETE /trackers/{tracker_id}`

**Description:** Delete tracker and all associated logs/journals

**Response (200 OK):**

```json
{
  "message": "Tracker with ID 1 was deleted successfully"
}
```

**Warning:** This is irreversible and deletes all related data.

---

### Logs

Record habit activity.

#### Create Log

**Endpoint:** `POST /trackers/{tracker_id}/logs`

**Description:** Log activity for a tracker

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| timestamp | datetime | Yes | When the activity occurred |

**Request Body:**

```json
{
  "amount": 45.0
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  "tracker_id": 1,
  "timestamp": "2024-03-15T00:00:00",
  "amount": 45.0
}
```

**Example cURL:**

```bash
curl -X POST "http://localhost:8000/api/trackers/1/logs?timestamp=2024-03-15T00:00:00" \
  -H "Content-Type: application/json" \
  -d '{"amount": 45.0}'
```

---

#### Get Tracker Logs

**Endpoint:** `GET /trackers/{tracker_id}/logs`

**Description:** Get all logs for a tracker

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "tracker_id": 1,
    "timestamp": "2024-03-15T00:00:00",
    "amount": 45.0
  },
  {
    "id": 2,
    "tracker_id": 1,
    "timestamp": "2024-03-14T00:00:00",
    "amount": 50.0
  }
]
```

---

#### Delete Log

**Endpoint:** `DELETE /trackers/{tracker_id}/logs/{log_id}`

**Description:** Delete a specific log

**Response (200 OK):**

```json
{
  "message": "Log deleted"
}
```

---

### Journals

Record thoughts, moods, and notes.

#### Create Journal Entry

**Endpoint:** `POST /trackers/{tracker_id}/journal`

**Description:** Create a journal entry for a tracker

**Request Body:**

```json
{
  "mood": 8,
  "content": "Great reading session today! Made good progress.",
  "is_relapse": false
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  "tracker_id": 1,
  "timestamp": "2024-03-15T10:30:00",
  "mood": 8,
  "content": "Great reading session today! Made good progress.",
  "is_relapse": false
}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| mood | integer | Mood rating (1-10, optional) |
| content | string | Journal text |
| is_relapse | boolean | Mark as relapse for quit trackers |

---

#### Get Journal Entries

**Endpoint:** `GET /trackers/{tracker_id}/journal`

**Description:** Get all journal entries for a tracker

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "tracker_id": 1,
    "timestamp": "2024-03-15T10:30:00",
    "mood": 8,
    "content": "Great reading session today!",
    "is_relapse": false
  },
  {
    "id": 2,
    "tracker_id": 1,
    "timestamp": "2024-03-14T15:00:00",
    "mood": 7,
    "content": "Good day, read before bed.",
    "is_relapse": false
  }
]
```

---

#### Update Journal Entry

**Endpoint:** `PUT /trackers/{tracker_id}/journal/{journal_id}`

**Description:** Edit a journal entry

**Request Body:**

```json
{
  "mood": 9,
  "content": "Amazing reading session! Finished a chapter."
}
```

**Response (200 OK):** Updated journal entry

---

#### Delete Journal Entry

**Endpoint:** `DELETE /trackers/{tracker_id}/journal/{journal_id}`

**Description:** Delete a journal entry

**Response (200 OK):**

```json
{
  "message": "Journal with ID 1 was deleted successfully"
}
```

---

### Dashboard

View aggregated data across all trackers.

#### Get Dashboard Summary

**Endpoint:** `GET /dashboard/summary`

**Description:** Get overview of all trackers with aggregated stats

**Response (200 OK):**

```json
{
  "overview": {
    "total": 5,
    "active": 4,
    "paused": 1,
    "categories": 3,
    "by_type": {
      "build": 3,
      "quit": 1,
      "boolean": 1
    }
  },
  "category_breakdown": [
    {
      "category": "Learning",
      "count": 3
    },
    {
      "category": "Health",
      "count": 2
    }
  ],
  "impact_rows": [
    {
      "tracker": {
        "id": 1,
        "name": "Reading",
        "category": "Learning",
        "type": "build",
        "unit": "pages",
        "units_per_amount": 2,
        "units_per": "day",
        "units_per_interval": 1,
        "impact_amount": 5.0,
        "impact_per": "day",
        "impact_unit": "$",
        "start_date": "2024-03-01T00:00:00",
        "current_streak_start_date": "2024-03-10T00:00:00",
        "is_active": true
      },
      "main_amount": 95.0,
      "impact_value": 23.75,
      "month_impact": 712.5,
      "mode_label": "95 pages"
    }
  ],
  "top_impact_rows": [
    {
      "tracker": { ... },
      "main_amount": 120.0,
      "impact_value": 24.0,
      "month_impact": 720.0,
      "mode_label": "120 minutes"
    }
  ]
}
```

**Fields:**

- **overview**: High-level stats
  - `total`: Total number of trackers
  - `active`: Number of active trackers
  - `paused`: Number of paused trackers
  - `categories`: Number of unique categories
  - `by_type`: Count by tracker type

- **category_breakdown**: Trackers grouped by category

- **impact_rows**: All trackers with impact data
  - `month_impact`: Estimated monthly value

- **top_impact_rows**: Top 6 highest-value trackers (sorted)

---

#### Get Dashboard Home State

**Endpoint:** `GET /dashboard/home`

**Description:** Get dashboard layout and widget positions

**Response (200 OK):**

```json
{
  "widgets": [
    {
      "type": "impact_summary",
      "position": 0
    },
    {
      "type": "tracker_overview",
      "position": 1
    }
  ],
  "layouts": {
    "lg": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 2,
        "i": "0"
      }
    ]
  },
  "updated_at": "2024-03-15T10:30:00"
}
```

---

#### Update Dashboard Home State

**Endpoint:** `PUT /dashboard/home`

**Description:** Save dashboard layout and widget positions

**Request Body:**

```json
{
  "widgets": [
    {
      "type": "impact_summary",
      "position": 0
    },
    {
      "type": "tracker_overview",
      "position": 1
    }
  ],
  "layouts": {
    "lg": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 2,
        "i": "0"
      }
    ]
  }
}
```

**Response (200 OK):** Updated state with new `updated_at` timestamp

---

## Examples

### Example 1: Create a Build Tracker

```bash
curl -X POST "http://localhost:8000/api/trackers/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Exercise",
    "category": "Health",
    "type": "build",
    "unit": "minutes",
    "units_per_amount": 30,
    "units_per": "day",
    "impact_amount": 2.0,
    "impact_per": "day"
  }'
```

### Example 2: Log Activity

```bash
curl -X POST "http://localhost:8000/api/trackers/1/logs?timestamp=2024-03-15T06:30:00" \
  -H "Content-Type: application/json" \
  -d '{"amount": 30.0}'
```

### Example 3: Add Journal Entry

```bash
curl -X POST "http://localhost:8000/api/trackers/1/journal" \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 9,
    "content": "Completed morning run. Felt energized!"
  }'
```

### Example 4: Get Complete Tracker Data

```bash
curl "http://localhost:8000/api/trackers/1/bundle"
```

### Example 5: Get Dashboard Summary

```bash
curl "http://localhost:8000/api/dashboard/summary"
```

### JavaScript Example

```javascript
// Get tracker with all data
async function getTrackerData(trackerId) {
  const response = await fetch(`http://localhost:8000/api/trackers/${trackerId}/bundle`);
  const data = await response.json();
  return data;
}

// Create a new log
async function logActivity(trackerId, amount) {
  const timestamp = new Date().toISOString();
  const response = await fetch(
    `http://localhost:8000/api/trackers/${trackerId}/logs?timestamp=${timestamp}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    }
  );
  return response.json();
}

// Get dashboard summary
async function getDashboard() {
  const response = await fetch('http://localhost:8000/api/dashboard/summary');
  return response.json();
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Tracker/log not found |
| 500 | Server Error | Unexpected error |

### Error Response Format

```json
{
  "detail": "Tracker not found"
}
```

### Common Errors

**Missing required field:**
```json
{
  "detail": [
    {
      "loc": ["body", "name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Invalid tracker ID:**
```json
{
  "detail": "Tracker not found"
}
```

**Invalid date format:**
```json
{
  "detail": [
    {
      "loc": ["query", "timestamp"],
      "msg": "invalid datetime format",
      "type": "value_error.datetime"
    }
  ]
}
```

---

## Tips & Best Practices

### 1. Batch Operations

For better performance with multiple updates:

```javascript
// Good: Get all data in one request
const bundle = await fetch('/api/trackers/1/bundle').then(r => r.json());

// Avoid: Multiple separate requests
const tracker = await fetch('/api/trackers/1').then(r => r.json());
const logs = await fetch('/api/trackers/1/logs').then(r => r.json());
const journals = await fetch('/api/trackers/1/journal').then(r => r.json());
const analytics = await fetch('/api/trackers/1/analytics').then(r => r.json());
```

### 2. Use Analytics Endpoint

Let the backend compute analytics instead of deriving locally:

```javascript
// Good: Get pre-computed analytics
const analytics = await fetch('/api/trackers/1/analytics').then(r => r.json());
console.log(analytics.streak_stats.current); // Already calculated

// Avoid: Computing in frontend
const logs = await fetch('/api/trackers/1/logs').then(r => r.json());
const streak = computeStreak(logs); // Your custom calculation
```

### 3. Dashboard Summary

When building a dashboard view, use the summary endpoint:

```javascript
// Good: One request gets everything
const summary = await fetch('/api/dashboard/summary').then(r => r.json());

// Avoid: Fetching each tracker individually
const trackers = await fetch('/api/trackers/').then(r => r.json());
for (const tracker of trackers) {
  const analytics = await fetch(`/api/trackers/${tracker.id}/analytics`).then(r => r.json());
  // Process each...
}
```

### 4. Date Handling

Always use ISO 8601 format for dates:

```javascript
// Good
const timestamp = new Date().toISOString(); // "2024-03-15T10:30:00.000Z"

// Avoid
const timestamp = "03/15/2024"; // Wrong format
```

### 5. Error Handling

Always handle potential errors:

```javascript
async function createTracker(trackerData) {
  try {
    const response = await fetch('/api/trackers/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackerData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', error.detail);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

### 6. Impact Calculation

Understand how impact is calculated:

```javascript
// For a tracker with:
// - impact_amount: 5.0
// - impact_per: "day"
// - 95 units logged today

const dailyImpact = 5.0; // Fixed daily value
const monthlyImpact = 5.0 * 30; // Roughly $150/month
const yearlyImpact = 5.0 * 365; // Roughly $1825/year
```

### 7. Tracker Types

Choose the right type for your use case:

```javascript
// Build: Track positive activity
{
  type: "build",
  unit: "pages",
  units_per_amount: 2,
  units_per: "day", // Goal: 2 pages per day
  impact_amount: 5,
  impact_per: "day"
}

// Quit: Track time since stopping
{
  type: "quit",
  unit: "days",
  units_per_amount: 1,
  units_per: "day", // Just count days
  impact_amount: 10,
  impact_per: "month" // Save $10/month
}

// Boolean: Just track if it happened
{
  type: "boolean",
  unit: "completion",
  units_per_amount: 1,
  units_per: "day" // Did it today? Yes/No
}
```

---

## Need Help?

- **Issues:** Report bugs on [GitHub Issues](https://github.com/Sparths/AnyHabit/issues)
- **Community:** Join the [Discord Server](https://discord.gg/ajknBq5zcH)
- **Main README:** See [Project README](../README.md)

---

## Version

- **API Version:** 1.0
- **Last Updated:** March 2024
- **Base URL:** `http://localhost:8000/api`

For the latest changes, see the [GitHub Repository](https://github.com/Sparths/AnyHabit).
