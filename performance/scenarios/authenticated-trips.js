import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getApiUrl } from '../config/environments.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { getRandomTripPayload } from '../helpers/payloads.js';
import { baseThresholds } from '../config/thresholds.js';

const tripListDuration = new Trend('trip_list_duration', true);
const errorRate = new Rate('trip_list_error_rate');
const requestsTotal = new Counter('trip_list_requests_total');

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    ...baseThresholds,
    trip_list_duration: ['p(50)<80', 'p(95)<200', 'p(99)<400'],
    trip_list_error_rate: ['rate<0.01'],
  },
};

export function setup() {
  const authHeaders = getAuthHeaders('trips_reader');

  // Pre-seed 3 sample trips for this user so reads test actual document retrieval
  if (authHeaders) {
    for (let i = 0; i < 3; i++) {
      const payload = JSON.stringify(getRandomTripPayload(false));
      http.post(getApiUrl('/trips'), payload, { headers: authHeaders });
    }
  }

  return { authHeaders };
}

export default function (data) {
  if (!data.authHeaders) return;

  const start = Date.now();
  const res = http.get(getApiUrl('/trips'), { headers: data.authHeaders });
  const duration = Date.now() - start;

  tripListDuration.add(duration);
  requestsTotal.add(1);

  const passed = check(res, {
    'status is 200': (r) => r.status === 200,
    'returns trips array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && Array.isArray(body.trips);
      } catch (_) {
        return false;
      }
    },
  });

  errorRate.add(passed ? 0 : 1);

  sleep(0.2); // Pacing
}

