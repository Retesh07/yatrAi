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
    { duration: '15s', target: 2 },  // Low baseline (2 VUs)
    { duration: '10s', target: 40 }, // Sudden sharp spike to 40 VUs
    { duration: '20s', target: 40 }, // Sustained spike traffic
    { duration: '10s', target: 2 },  // Rapid drop to 2 VUs
    { duration: '20s', target: 2 },  // Recovery observation period
  ],
  thresholds: {
    http_req_duration: ['p(95)<3500', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],
    api_http_failure_rate: ['rate<0.05'],
  },
};

export function setup() {
  const authHeaders = getAuthHeaders('spike_runner');
  return { authHeaders };
}

export default function (data) {
  if (!data.authHeaders) return;

  const rand = Math.random();

  if (rand < 0.70) {
    // 70% public feed browse
    const start = Date.now();
    const res = http.get(getApiUrl('/trips/public'), { tags: { name: 'public_feed' } });
    tripReadLatency.add(Date.now() - start);
    requestsTotal.add(1);

    const ok = check(res, { 'public trips 200': (r) => r.status === 200 });
    failureRate.add(ok ? 0 : 1);
  } else {
    // 30% trip write
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
  return formatK6Summary(data, 'TRAFFIC SPIKE TEST REPORT (2 -> 40 -> 2 VUs)');
}

