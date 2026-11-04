import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getBaseUrl } from '../config/environments.js';
import { baseThresholds } from '../config/thresholds.js';

// Custom metrics
const healthDuration = new Trend('health_req_duration', true);
const errorRate = new Rate('health_error_rate');
const successCounter = new Counter('health_success_total');

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    ...baseThresholds,
    health_req_duration: ['p(50)<50', 'p(95)<150', 'p(99)<250'],
    health_error_rate: ['rate<0.005'],
  },
};

export default function () {
  const start = Date.now();
  const res = http.get(getBaseUrl());
  const duration = Date.now() - start;

  healthDuration.add(duration);

  const passed = check(res, {
    'status is 200': (r) => r.status === 200,
    'has expected message': (r) => {
      try {
        return JSON.parse(r.body).message.includes('YatrAI API is running');
      } catch (_) {
        return false;
      }
    },
  });

  if (passed) {
    successCounter.add(1);
    errorRate.add(0);
  } else {
    errorRate.add(1);
  }

  sleep(0.1); // Small pacing delay
}

