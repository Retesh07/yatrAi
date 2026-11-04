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
  // Soak test: steady moderate load for an extended period
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '15m',
  thresholds: {
    http_req_duration: ['p(95)<2500', 'p(99)<4000'],
    http_req_failed: ['rate<0.01'],
    api_http_failure_rate: ['rate<0.01'],
  },
};

export function setup() {
  const authHeaders = getAuthHeaders('soak_runner');
  return { authHeaders };
}

export default function (data) {
  if (!data.authHeaders) return;

  const rand = Math.random();

  if (rand < 0.65) {
    // 65% Reads
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
    // 35% Writes
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

  // Pacing with random jitter
  sleep(0.5 + Math.random() * 0.5);
}

export function handleSummary(data) {
  return formatK6Summary(data, 'EXTENDED SOAK TEST REPORT (Stability & Drift)');
}

