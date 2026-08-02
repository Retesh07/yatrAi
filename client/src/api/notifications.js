const BASE_URL = '/api/v1';

async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export function apiGetNotifications(token) {
  return apiRequest('/notifications', { token });
}

export function apiMarkNotificationRead(notificationId, token) {
  return apiRequest(`/notifications/${notificationId}/read`, { method: 'PUT', token });
}
