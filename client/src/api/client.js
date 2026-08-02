import { API_BASE_URL } from './config';

/**
 * Generic API request helper.
 */
export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include', // send httpOnly refresh cookie on every request
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

/* ── Trip helpers ─────────────────────────────────────────── */

/** Create a new trip (draft) from wizard data */
export function apiCreateTrip(tripData, token) {
  return apiRequest('/trips', { method: 'POST', body: tripData, token });
}

/** Trigger AI generation for an existing draft trip */
export function apiGenerateTrip(tripId, token) {
  return apiRequest(`/trips/${tripId}/generate`, { method: 'POST', token });
}

/** Get all trips for the logged-in user */
export function apiGetMyTrips(token) {
  return apiRequest('/trips', { token });
}

/** Get publicly shared trips */
export function apiGetPublicTrips(token) {
  return apiRequest('/trips/public', { token });
}

/** Get a single trip by ID */
export function apiGetTrip(tripId, token) {
  return apiRequest(`/trips/${tripId}`, { token });
}

/** Update a trip */
export function apiUpdateTrip(tripId, updates, token) {
  return apiRequest(`/trips/${tripId}`, { method: 'PUT', body: updates, token });
}

/** Delete a trip */
export function apiDeleteTrip(tripId, token) {
  return apiRequest(`/trips/${tripId}`, { method: 'DELETE', token });
}
