import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getApiUrl } from '../config/environments.js';
import { baseThresholds } from '../config/thresholds.js';

const publicFeedDuration = new Trend('public_feed_duration', true);
const errorRate = new Rate('public_feed_error_rate');
const requestsTotal = new Counter('public_feed_requests_total');

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    ...baseThresholds,
    public_feed_duration: ['p(50)<80', 'p(95)<220', 'p(99)<450'],
    public_feed_error_rate: ['rate<0.01'],
  },
};

export default function () {
  const start = Date.now();
  const res = http.get(getApiUrl('/trips/public'));
  const duration = Date.now() - start;

  publicFeedDuration.add(duration);
  requestsTotal.add(1);

  const passed = check(res, {
    'status is 200': (r) => r.status === 200,
    'returns array of trips': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && Array.isArray(body.trips);
      } catch (_) {
        return false;
      }
    },
  });

  errorRate.add(passed ? 0 : 1);

  sleep(0.15); // Pacing
}

