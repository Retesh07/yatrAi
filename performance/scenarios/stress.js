import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getApiUrl } from '../config/environments.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { getRandomTripPayload } from '../helpers/payloads.js';
import { summaryTrendStats } from '../config/thresholds.js';
import { formatK6Summary } from '../helpers/summaryFormatter.js';

const tripReadLatency = new Trend('api_trip_read_latency_ms', true);
const tripCreateLatency = new Trend('api_trip_create_latency_ms', true);
const failureRate = new Rate('api_http_failure_rate');
const requestsTotal = new Counter('api_requests_total');

export const options = {
  summaryTrendStats: summaryTrendStats,
  stages: [
    { duration: '20s', target: 5 },   // Warm-up to 5 VUs
    { duration: '20s', target: 15 },  // Step up to 15 VUs
    { duration: '20s', target: 30 },  // Step up to 30 VUs
    { duration: '30s', target: 50 },  // Heavy stress at 50 VUs
    { duration: '20s', target: 75 },  // Peak breaking point check (75 VUs)
    { duration: '20s', target: 0 },   // Cool-down & recovery observation
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<4500'],
    http_req_failed: ['rate<0.05'], // Flag degradation if errors exceed 5%
    api_http_failure_rate: ['rate<0.05'],
  },
};

export function setup() {
  const authHeaders = getAuthHeaders('stress_runner');
  return { authHeaders };
}

export default function (data) {
  if (!data.authHeaders) return;

  const rand = Math.random();

  if (rand < 0.60) {
    // 60% Read Load (GET /trips)
    const start = Date.now();
    const res = http.get(getApiUrl('/trips'), {
      headers: data.authHeaders,
      tags: { name: 'get_my_trips' },
    });
    tripReadLatency.add(Date.now() - start);
    requestsTotal.add(1);

    const ok = check(res, { 'get trips 200': (r) => r.status === 200 });
    failureRate.add(ok ? 0 : 1);
  } else {
    // 40% Write Load (POST /trips)
    const payload = JSON.stringify(getRandomTripPayload(false));
    const start = Date.now();
    const res = http.post(getApiUrl('/trips'), payload, {
      headers: data.authHeaders,
      tags: { name: 'create_trip' },
    });
    tripCreateLatency.add(Date.now() - start);
    requestsTotal.add(1);

    const ok = check(res, { 'create trip 201': (r) => r.status === 201 });
    failureRate.add(ok ? 0 : 1);
  }

  sleep(0.1 + Math.random() * 0.2);
}

export function handleSummary(data) {
  return formatK6Summary(data, 'STRESS TEST REPORT (5 -> 75 VUs)');
}

