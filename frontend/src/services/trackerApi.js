import { API_URL } from '../config/api';

async function requestJson(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchTrackersApi() {
  return requestJson('/trackers/');
}

export async function fetchJournalsApi(trackerId) {
  const journals = await requestJson(`/trackers/${trackerId}/journal/`);
  return journals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function fetchHabitLogsApi(trackerId) {
  const logs = await requestJson(`/trackers/${trackerId}/logs/`);
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function normalizeTrackerAnalytics(data) {
  const formatValue = (value, digits) => Number(value ?? 0).toFixed(digits);

  return {
    currentMath: {
      mainUnit: formatValue(data?.current_math?.main_unit, 1),
      targetUnit: formatValue(data?.current_math?.target_unit, 1),
      impactValue: formatValue(data?.current_math?.impact_value, 2)
    },
    dailyProgress: {
      total: Number(data?.daily_progress?.total ?? 0),
      target: Number(data?.daily_progress?.target ?? 0),
      percentage: Number(data?.daily_progress?.percentage ?? 0)
    },
    historicalChartData: (data?.historical_chart_data ?? []).map((point) => ({
      date: point.date,
      label: point.label,
      value: Number(point.value ?? 0),
      ...(point.cumulative !== null && point.cumulative !== undefined
        ? { cumulative: Number(point.cumulative) }
        : {})
    })),
    streakStats: {
      current: Number(data?.streak_stats?.current ?? 0),
      longest: Number(data?.streak_stats?.longest ?? 0),
      periodLabel: data?.streak_stats?.period_label ?? 'days'
    },
    buildHeatmap: data?.build_heatmap
      ? {
          maxAmount: Number(data.build_heatmap.max_amount ?? 0),
          columns: (data.build_heatmap.columns ?? []).map((week) =>
            week.map((cell) => ({
              date: cell.date,
              amount: Number(cell.amount ?? 0),
              isFiller: Boolean(cell.is_filler)
            }))
          )
        }
      : null
  };
}

export async function fetchTrackerAnalyticsApi(trackerId) {
  const analytics = await requestJson(`/trackers/${trackerId}/analytics`);
  return normalizeTrackerAnalytics(analytics);
}

export async function saveTrackerApi(trackerFormData) {
  const isEdit = !!trackerFormData.id;
  const isBoolean = trackerFormData.type === 'boolean';
  const url = isEdit ? `/trackers/${trackerFormData.id}/` : '/trackers/';
  const method = isEdit ? 'PATCH' : 'POST';
  const parsedInterval = parseInt(trackerFormData.units_per_interval, 10);
  const unitsPerInterval = Number.isNaN(parsedInterval) ? 1 : Math.max(1, parsedInterval);

  const payload = {
    name: trackerFormData.name,
    category: trackerFormData.category.trim() || 'General',
    type: trackerFormData.type,
    unit: isBoolean ? 'Times' : trackerFormData.unit,
    impact_amount: isBoolean ? 0.0 : parseFloat(trackerFormData.impact_amount) || 0.0,
    impact_unit: isBoolean ? '$' : ((trackerFormData.impact_unit || '$').trim() || '$'),
    impact_per: trackerFormData.impact_per,
    units_per_amount: isBoolean ? 1.0 : parseFloat(trackerFormData.units_per_amount) || 0.0,
    units_per: trackerFormData.units_per,
    units_per_interval: unitsPerInterval,
    is_active: trackerFormData.is_active
  };

  return requestJson(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function deleteTrackerApi(id) {
  return requestJson(`/trackers/${id}`, { method: 'DELETE' });
}

export async function toggleTrackerStatusApi(tracker) {
  const action = tracker.is_active ? 'stop' : 'start';
  return requestJson(`/trackers/${tracker.id}/${action}`, { method: 'PUT' });
}

export async function resetTrackerApi(trackerId) {
  return requestJson(`/trackers/${trackerId}/reset`, { method: 'POST' });
}

export async function saveJournalApi(trackerId, journalFormData) {
  const isEdit = !!journalFormData.id;
  const url = isEdit
    ? `/trackers/${trackerId}/journal/${journalFormData.id}`
    : `/trackers/${trackerId}/journal/`;
  const method = isEdit ? 'PUT' : 'POST';

  return requestJson(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: journalFormData.content,
      mood: parseInt(journalFormData.mood, 10)
    })
  });
}

export async function deleteJournalApi(trackerId, journalId) {
  return requestJson(`/trackers/${trackerId}/journal/${journalId}`, { method: 'DELETE' });
}

export async function createLogApi(trackerId, logFormData) {
  const timestamp = logFormData.timestamp || new Date().toISOString();
  return requestJson(`/trackers/${trackerId}/logs/?timestamp=${encodeURIComponent(timestamp)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: parseFloat(logFormData.amount) })
  });
}

export async function createBooleanLogApi(trackerId) {
  const timestamp = new Date().toISOString();
  return requestJson(`/trackers/${trackerId}/logs/?timestamp=${encodeURIComponent(timestamp)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 1.0 })
  });
}

export async function deleteLogApi(trackerId, logId) {
  return requestJson(`/trackers/${trackerId}/logs/${logId}`, { method: 'DELETE' });
}
