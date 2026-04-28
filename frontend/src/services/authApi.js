import { API_FETCH_OPTIONS, API_URL } from '../config/api';

async function requestJson(path, options) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {})
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...API_FETCH_OPTIONS,
    ...options,
    headers
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(message || `Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function registerApi(payload) {
  return requestJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function loginApi(payload) {
  return requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchCurrentUserApi() {
  return requestJson('/auth/me');
}

export async function logoutApi() {
  return requestJson('/auth/logout', { method: 'POST' });
}
