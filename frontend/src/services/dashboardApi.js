import { API_URL } from '../config/api';

async function requestJson(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchHomeDashboardApi() {
  return requestJson('/dashboard/home');
}

export async function saveHomeDashboardApi(payload) {
  return requestJson('/dashboard/home', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
