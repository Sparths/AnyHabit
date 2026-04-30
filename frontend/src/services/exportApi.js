import { API_FETCH_OPTIONS, API_URL } from '../config/api';

async function requestExport(path, options) {
  const headers = {
    ...(options?.headers || {})
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...API_FETCH_OPTIONS,
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

  // Return the raw text response (could be JSON or CSV)
  return response.text();
}

export async function exportDataApi(options) {
  const { data_type = 'all', format = 'json', tracker_ids = null } = options;

  const params = new URLSearchParams({
    data_type,
    format
  });

  if (tracker_ids && Array.isArray(tracker_ids)) {
    tracker_ids.forEach((id) => params.append('tracker_id', id));
  }

  return requestExport(`/export/?${params.toString()}`, {
    method: 'GET'
  });
}
