import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { getApiUrl } from '../config/environments.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { summaryTrendStats } from '../config/thresholds.js';
import { formatK6Summary } from '../helpers/summaryFormatter.js';

const authLatency = new Trend('api_auth_latency_ms', true);
const authFailureRate = new Rate('api_http_failure_rate');

export const options = {
  summaryTrendStats: summaryTrendStats,
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '20s',
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    api_http_failure_rate: ['rate<0.01'],
  },
};

export function setup() {
  const email = 'perf_auth_spec@yatrai-loadtest.com';
  const password = 'AuthPassword123!';
  const name = 'Auth Tester';

  // Ensure account exists
  http.post(getApiUrl('/auth/register'), JSON.stringify({ name, email, password }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return { email, password };
}

export default function (data) {
  // 1. Successful Login -> returns accessToken and sets refreshToken cookie
  const startLogin = Date.now();
  const loginRes = http.post(
    getApiUrl('/auth/login'),
    JSON.stringify({ email: data.email, password: data.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  authLatency.add(Date.now() - startLogin);

  const loginOk = check(loginRes, {
    'valid credentials login 200': (r) => r.status === 200,
    'has accessToken': (r) => {
      try {
        return JSON.parse(r.body).accessToken !== undefined;
      } catch (_) {
        return false;
      }
    },
    'sets refreshToken cookie': (r) => {
      return r.headers['Set-Cookie'] !== undefined;
    },
  });
  authFailureRate.add(loginOk ? 0 : 1);

  let token = null;
  try {
    token = JSON.parse(loginRes.body).accessToken;
  } catch (_) {}

  // 2. Access protected route WITH valid access token -> 200
  if (token) {
    const protectedRes = http.get(getApiUrl('/protected'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const protectedOk = check(protectedRes, {
      'valid token allowed 200': (r) => r.status === 200,
    });
    authFailureRate.add(protectedOk ? 0 : 1);
  }

  // 3. Access protected route WITHOUT token -> 401
  const noTokenRes = http.get(getApiUrl('/protected'));
  const noTokenOk = check(noTokenRes, {
    'missing token rejected 401': (r) => r.status === 401,
  });
  authFailureRate.add(noTokenOk ? 0 : 1);

  // 4. Access protected route with INVALID token -> 401
  const badTokenRes = http.get(getApiUrl('/protected'), {
    headers: { Authorization: 'Bearer invalid.tampered.token.123' },
  });
  const badTokenOk = check(badTokenRes, {
    'invalid token rejected 401': (r) => r.status === 401,
  });
  authFailureRate.add(badTokenOk ? 0 : 1);

  // 5. Refresh token flow (POST /api/v1/auth/refresh)
  // Extract refreshToken cookie from login response
  const cookies = loginRes.headers['Set-Cookie'];
  if (cookies) {
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies;
    const refreshRes = http.post(getApiUrl('/auth/refresh'), null, {
      headers: { Cookie: cookieHeader },
    });
    const refreshOk = check(refreshRes, {
      'refresh token rotated 200': (r) => r.status === 200,
      'new accessToken returned': (r) => {
        try {
          return JSON.parse(r.body).accessToken !== undefined;
        } catch (_) {
          return false;
        }
      },
    });
    authFailureRate.add(refreshOk ? 0 : 1);
  }

  // 6. Invalid refresh token rejected -> 401
  const badRefreshRes = http.post(getApiUrl('/auth/refresh'), null, {
    headers: { Cookie: 'refreshToken=invalid_token_xyz; Path=/' },
  });
  const badRefreshOk = check(badRefreshRes, {
    'invalid refresh token rejected 401': (r) => r.status === 401,
  });
  authFailureRate.add(badRefreshOk ? 0 : 1);

  sleep(0.5);
}

export function handleSummary(data) {
  return formatK6Summary(data, 'AUTHENTICATION & JWT LIFECYCLE BENCHMARK');
}

