import { API_BASE_URL } from './config';

const BASE = `${API_BASE_URL}/auth`;

/**
 * POST /api/v1/auth/register
 */
export async function apiRegister(name, email, password) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',          // send/receive httpOnly cookies
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  return data;
}

/**
 * POST /api/v1/auth/login
 */
export async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data; // { success, accessToken, user }
}

/**
 * POST /api/v1/auth/logout
 */
const parseJsonResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  if (contentType.includes('application/json')) {
    return JSON.parse(text || '{}');
  }
  return { success: res.ok, message: text || res.statusText };
};

export async function apiLogout(accessToken) {
  const res = await fetch(`${BASE}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.message || 'Logout failed');
  return data;
}

/**
 * PUT /api/v1/auth/password
 */
export async function apiChangePassword(currentPassword, newPassword, accessToken) {
  const res = await fetch(`${BASE}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.message || 'Password change failed');
  return data;
}

/**
 * POST /api/v1/auth/reset-password
 */
export async function apiRequestPasswordReset(email) {
  const res = await fetch(`${BASE}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.message || 'Password reset request failed');
  return data;
}

/**
 * POST /api/v1/auth/reset-password/confirm
 */
export async function apiConfirmPasswordReset(email, otp, newPassword) {
  const res = await fetch(`${BASE}/reset-password/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, otp, newPassword }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.message || 'Password reset failed');
  return data;
}

/**
 * DELETE /api/v1/auth/account
 */
export async function apiDeleteAccount(accessToken) {
  const res = await fetch(`${BASE}/account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.message || 'Account deletion failed');
  return data;
}

/**
 * POST /api/v1/auth/refresh
 * Uses the httpOnly refresh cookie automatically
 */
export async function apiRefreshToken() {
  const res = await fetch(`${BASE}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Session expired');
  return data; // { success, accessToken }
}
