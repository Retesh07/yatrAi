import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getApiUrl } from '../config/environments.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { getRandomTripPayload } from '../helpers/payloads.js';
import { summaryTrendStats } from '../config/thresholds.js';
import { formatK6Summary } from '../helpers/summaryFormatter.js';

// Dedicated Trends
const loginLatency = new Trend('api_auth_latency_ms', true);
const tripCreateLatency = new Trend('api_trip_create_latency_ms', true);
const tripReadLatency = new Trend('api_trip_read_latency_ms', true);

const httpFailureRate = new Rate('api_http_failure_rate');
const requestCounter = new Counter('api_requests_total');

export const options = {
  summaryTrendStats: summaryTrendStats,
  vus: Number(__ENV.VUS || 15),
  duration: __ENV.DURATION || '45s',
  thresholds: {
    http_req_duration: ['p(50)<300', 'p(95)<1500', 'p(99)<2500'],
    http_req_failed: ['rate<0.01'],
    api_http_failure_rate: ['rate<0.01'],
  },
};

export function setup() {
  const authHeaders = getAuthHeaders('api_load_runner');

  // Create an initial trip so GET /trips/:id has an ID to query
  let seedTripId = null;
  if (authHeaders) {
    const payload = JSON.stringify(getRandomTripPayload(false));
    const res = http.post(getApiUrl('/trips'), payload, { headers: authHeaders });
    try {
      seedTripId = JSON.parse(res.body).trip._id;
    } catch (_) {}
  }

  return { authHeaders, seedTripId };
}

export default function (data) {
  if (!data.authHeaders) return;

  const rand = Math.random();

  if (rand < 0.35) {
    // 1. List user trips (GET /api/v1/trips)
    const start = Date.now();
    const res = http.get(getApiUrl('/trips'), {
      headers: data.authHeaders,
      tags: { name: 'list_trips' },
    });
    tripReadLatency.add(Date.now() - start);
    requestCounter.add(1);

    const ok = check(res, { 'get trips 200': (r) => r.status === 200 });
    httpFailureRate.add(ok ? 0 : 1);

  } else if (rand < 0.65) {
    // 2. Fetch single trip by ID (GET /api/v1/trips/:id)
    if (data.seedTripId) {
      const start = Date.now();
      const res = http.get(getApiUrl(`/trips/${data.seedTripId}`), {
        headers: data.authHeaders,
        tags: { name: 'get_trip_by_id' },
      });
      tripReadLatency.add(Date.now() - start);
      requestCounter.add(1);

      const ok = check(res, { 'get trip by id 200': (r) => r.status === 200 });
      httpFailureRate.add(ok ? 0 : 1);
    }

  } else {
    // 3. Create trip (POST /api/v1/trips)
    const payload = JSON.stringify(getRandomTripPayload(false));
    const start = Date.now();
    const res = http.post(getApiUrl('/trips'), payload, {
      headers: data.authHeaders,
      tags: { name: 'create_trip' },
    });
    tripCreateLatency.add(Date.now() - start);
    requestCounter.add(1);

    const ok = check(res, { 'create trip 201': (r) => r.status === 201 });
    httpFailureRate.add(ok ? 0 : 1);
  }

  sleep(0.2 + Math.random() * 0.3); // Pacing
}

export function handleSummary(data) {
  return formatK6Summary(data, 'API LOAD TEST REPORT');
}

