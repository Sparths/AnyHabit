import { API_URL } from '../config/api';
import { getApiToken } from '../config/api';

async function requestJson(path, options) {
  const headers = {
    ...(options?.headers || {})
  };
  const token = getApiToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const message = await response.text();
    let errorMessage = message || `Request failed: ${response.status}`;

    try {
      const parsed = JSON.parse(message);
      errorMessage = parsed.detail || parsed.message || errorMessage;
    } catch {
      // keep plain-text response
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function fetchHomeDashboardApi() {
  return requestJson('/dashboard/home');
}

export async function fetchDashboardSummaryApi() {
  return requestJson('/dashboard/summary');
}

export async function saveHomeDashboardApi(payload) {
  return requestJson('/dashboard/home', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
