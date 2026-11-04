import http from 'k6/http';
import { check } from 'k6';
import { getApiUrl } from '../config/environments.js';

/**
 * Authenticates or registers a test user and returns valid auth headers.
 * Uses a deterministic test account to prevent uncontrolled DB growth.
 */
export function getAuthHeaders(userSuffix = 'default') {
  const email = `perf_test_user_${userSuffix}@yatrai-loadtest.com`;
  const password = 'PerfTestPassword123!';
  const name = `Load Tester ${userSuffix}`;

  const loginUrl = getApiUrl('/auth/login');
  const registerUrl = getApiUrl('/auth/register');

  const payload = JSON.stringify({ email, password });
  const headers = { 'Content-Type': 'application/json' };

  // Attempt login
  let res = http.post(loginUrl, payload, { headers });

  // If user does not exist (401), register first
  if (res.status === 401) {
    const regPayload = JSON.stringify({ name, email, password });
    const regRes = http.post(registerUrl, regPayload, { headers });
    check(regRes, { 'user registered': (r) => r.status === 201 });

    // Retry login
    res = http.post(loginUrl, payload, { headers });
  }

  const loginSuccess = check(res, {
    'login succeeded (200)': (r) => r.status === 200,
    'access token present': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.accessToken !== undefined;
      } catch (_) {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    console.error(`Failed to authenticate test user: ${res.status} ${res.body}`);
    return null;
  }

  const data = JSON.parse(res.body);
  return {
    Authorization: `Bearer ${data.accessToken}`,
    'Content-Type': 'application/json',
  };
}

