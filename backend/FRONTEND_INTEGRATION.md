# Building a Frontend with AnyHabit API

This guide walks you through integrating the AnyHabit API into your own frontend application.

## Prerequisites

- AnyHabit backend running (default: `http://localhost:8000`)
- Basic understanding of HTTP requests
- Any frontend framework (React, Vue, Svelte, vanilla JS, etc.)

## Basic Setup

### 1. Create API Client Module

Create a file to handle all API communication:

**JavaScript/React Example:**

```javascript
// api.js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'API Error');
  }

  return response.json();
}

export const api = {
  // Trackers
  trackers: {
    list: () => request('/trackers/'),
    get: (id) => request(`/trackers/${id}/bundle`),
    create: (data) => request('/trackers/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/trackers/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/trackers/${id}`, { method: 'DELETE' }),
    analytics: (id) => request(`/trackers/${id}/analytics`),
    start: (id) => request(`/trackers/${id}/start`, { method: 'PUT' }),
    stop: (id) => request(`/trackers/${id}/stop`, { method: 'PUT' }),
    reset: (id) => request(`/trackers/${id}/reset`, { method: 'POST' }),
  },

  // Logs
  logs: {
    list: (trackerId) => request(`/trackers/${trackerId}/logs`),
    create: (trackerId, amount, timestamp = new Date().toISOString()) =>
      request(`/trackers/${trackerId}/logs?timestamp=${timestamp}`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
    delete: (trackerId, logId) =>
      request(`/trackers/${trackerId}/logs/${logId}`, { method: 'DELETE' }),
  },

  // Journals
  journals: {
    list: (trackerId) => request(`/trackers/${trackerId}/journal`),
    create: (trackerId, data) =>
      request(`/trackers/${trackerId}/journal`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (trackerId, journalId, data) =>
      request(`/trackers/${trackerId}/journal/${journalId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (trackerId, journalId) =>
      request(`/trackers/${trackerId}/journal/${journalId}`, { method: 'DELETE' }),
  },

  // Dashboard
  dashboard: {
    summary: () => request('/dashboard/summary'),
    getLayout: () => request('/dashboard/home'),
    saveLayout: (data) =>
      request('/dashboard/home', { method: 'PUT', body: JSON.stringify(data) }),
  },
};
```

Note: The backend sets an HttpOnly JWT cookie on `/auth/login` and `/auth/register`. Keep auth state server-driven by calling `/auth/me` at app startup.

### 2. Use in React

**Hooks for data fetching:**

```javascript
// useTrackers.js
import { useState, useEffect } from 'react';
import { api } from './api';

export function useTrackers() {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTrackers();
  }, []);

  async function loadTrackers() {
    try {
      setLoading(true);
      const data = await api.trackers.list();
      setTrackers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { trackers, loading, error, refresh: loadTrackers };
}

// useTracker.js
export function useTracker(trackerId) {
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTracker();
  }, [trackerId]);

  async function loadTracker() {
    if (!trackerId) return;
    try {
      setLoading(true);
      const data = await api.trackers.get(trackerId);
      setTracker(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { tracker, loading, error, refresh: loadTracker };
}

// useDashboard.js
export function useDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const data = await api.dashboard.summary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  return { summary, loading, refresh: loadSummary };
}
```

**Component example:**

```javascript
// TrackerPage.jsx
import { useTracker } from './useTracker';
import { api } from './api';

function TrackerPage({ trackerId }) {
  const { tracker, loading, error, refresh } = useTracker(trackerId);
  const [amount, setAmount] = useState('');

  async function handleLogActivity() {
    try {
      await api.logs.create(trackerId, parseFloat(amount));
      setAmount('');
      refresh(); // Reload tracker data
    } catch (err) {
      alert('Failed to log activity: ' + err.message);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!tracker) return <div>Not found</div>;

  const analytics = tracker.analytics;

  return (
    <div>
      <h1>{tracker.tracker.name}</h1>

      {/* Display Analytics */}
      <div className="stats">
        <div>
          <strong>Current:</strong> {analytics.current_math.main_unit} {tracker.tracker.unit}
        </div>
        <div>
          <strong>Target:</strong> {analytics.current_math.target_unit} {tracker.tracker.unit}
        </div>
        <div>
          <strong>Progress:</strong> {analytics.daily_progress.percentage.toFixed(0)}%
        </div>
        <div>
          <strong>Streak:</strong> {analytics.streak_stats.current} {analytics.streak_stats.period_label}
        </div>
        <div>
          <strong>Impact:</strong> ${analytics.current_math.impact_value.toFixed(2)}
        </div>
      </div>

      {/* Log Activity Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleLogActivity(); }}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />
        <button type="submit">Log Activity</button>
      </form>

      {/* Display Logs */}
      <div className="logs">
        <h3>Recent Logs</h3>
        {tracker.habit_logs.slice(0, 5).map((log) => (
          <div key={log.id}>
            {new Date(log.timestamp).toLocaleDateString()}: {log.amount} {tracker.tracker.unit}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrackerPage;
```

## Building Views

### Dashboard/Overview

```javascript
function DashboardPage() {
  const { summary, loading, refresh } = useDashboard();

  if (loading) return <div>Loading dashboard...</div>;
  if (!summary) return <div>No data</div>;

  return (
    <div className="dashboard">
      {/* Overview Stats */}
      <div className="overview">
        <div>Total Trackers: {summary.overview.total}</div>
        <div>Active: {summary.overview.active}</div>
        <div>Paused: {summary.overview.paused}</div>
      </div>

      {/* Category Breakdown */}
      <div className="categories">
        <h3>By Category</h3>
        {summary.category_breakdown.map((cat) => (
          <div key={cat.category}>
            {cat.category}: {cat.count}
          </div>
        ))}
      </div>

      {/* Top Impact */}
      <div className="top-impact">
        <h3>Highest Impact</h3>
        {summary.top_impact_rows.map((row) => (
          <div key={row.tracker.id}>
            <strong>{row.tracker.name}</strong>
            <div>${row.month_impact.toFixed(2)}/month</div>
          </div>
        ))}
      </div>

      {/* All Impact Rows */}
      <div className="impact-table">
        <h3>All Trackers</h3>
        <table>
          <thead>
            <tr>
              <th>Tracker</th>
              <th>Amount</th>
              <th>Impact</th>
              <th>Monthly</th>
            </tr>
          </thead>
          <tbody>
            {summary.impact_rows.map((row) => (
              <tr key={row.tracker.id}>
                <td>{row.tracker.name}</td>
                <td>{row.mode_label}</td>
                <td>${row.impact_value.toFixed(2)}</td>
                <td>${row.month_impact.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Tracker List

```javascript
function TrackerListPage() {
  const { trackers, loading, refresh } = useTrackers();
  const [newTracker, setNewTracker] = useState({
    name: '',
    type: 'build',
    category: 'General',
    unit: '',
    units_per_amount: 1,
    impact_amount: 0,
  });

  async function handleCreateTracker(e) {
    e.preventDefault();
    try {
      await api.trackers.create(newTracker);
      setNewTracker({ name: '', type: 'build', category: 'General', unit: '' });
      refresh();
    } catch (err) {
      alert('Failed to create tracker: ' + err.message);
    }
  }

  async function handleDeleteTracker(id) {
    if (confirm('Delete tracker? This cannot be undone.')) {
      try {
        await api.trackers.delete(id);
        refresh();
      } catch (err) {
        alert('Failed to delete tracker: ' + err.message);
      }
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Trackers</h1>

      {/* Create Form */}
      <form onSubmit={handleCreateTracker}>
        <input
          required
          placeholder="Tracker name"
          value={newTracker.name}
          onChange={(e) => setNewTracker({ ...newTracker, name: e.target.value })}
        />
        <select
          value={newTracker.type}
          onChange={(e) => setNewTracker({ ...newTracker, type: e.target.value })}
        >
          <option value="build">Build</option>
          <option value="quit">Quit</option>
          <option value="boolean">Boolean</option>
        </select>
        <input
          required
          placeholder="Unit (e.g., pages, minutes)"
          value={newTracker.unit}
          onChange={(e) => setNewTracker({ ...newTracker, unit: e.target.value })}
        />
        <button type="submit">Create Tracker</button>
      </form>

      {/* Tracker List */}
      <div className="tracker-list">
        {trackers.map((tracker) => (
          <div key={tracker.id} className="tracker-card">
            <h3>{tracker.name}</h3>
            <p>Type: {tracker.type}</p>
            <p>Category: {tracker.category}</p>
            <p>Status: {tracker.is_active ? 'Active' : 'Paused'}</p>
            <button onClick={() => handleDeleteTracker(tracker.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

```javascript
async function safeApiCall(apiCall, fallback = null) {
  try {
    return await apiCall();
  } catch (err) {
    console.error('API Error:', err);
    // Show user-friendly error message
    showNotification('error', err.message);
    return fallback;
  }
}

// Usage
const trackers = await safeApiCall(
  () => api.trackers.list(),
  [] // Fallback to empty array
);
```

## Response Normalization

If your backend uses snake_case and frontend uses camelCase:

```javascript
function normalize(data) {
  if (Array.isArray(data)) {
    return data.map(normalize);
  }
  if (data && typeof data === 'object') {
    return Object.entries(data).reduce((acc, [key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      acc[camelKey] = normalize(value);
      return acc;
    }, {});
  }
  return data;
}

// Usage
const normalized = normalize(apiResponse);
```

## Performance Tips

1. **Cache data** - Don't refetch the same data repeatedly
2. **Use bundle endpoint** - Get tracker + logs + analytics in one request
3. **Debounce updates** - Don't send requests on every keystroke
4. **Lazy load** - Load analytics only when viewing tracker detail
5. **Batch operations** - Create multiple logs in one operation if possible

## Architecture Patterns

### Simple Pattern (No State Management)

```javascript
// Just use hooks, minimal abstraction
const { trackers, loading } = useTrackers();
```

### Redux/Zustand Pattern

```javascript
// Create slices for each domain
const trackerSelice = createSlice({
  name: 'trackers',
  initialState: { list: [], loading: false, error: null },
  reducers: { ... },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrackers.pending, (state) => { state.loading = true; })
      .addCase(fetchTrackers.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
      });
  },
});
```

### React Query Pattern

```javascript
import { useQuery, useMutation } from '@tanstack/react-query';

const useTrackers = () => {
  return useQuery({
    queryKey: ['trackers'],
    queryFn: () => api.trackers.list(),
  });
};

const useCreateTracker = () => {
  return useMutation({
    mutationFn: (data) => api.trackers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackers'] });
    },
  });
};
```

## Deployment Checklist

- [ ] Set correct API URL for environment
- [ ] Handle API errors gracefully
- [ ] Add loading states
- [ ] Implement authentication (if needed)
- [ ] Add error boundaries
- [ ] Cache data appropriately

## Resources

- [Full API Documentation](./README.md)
- [Quick Reference](./API_QUICK_REFERENCE.md)
- [Main Project README](../README.md)

