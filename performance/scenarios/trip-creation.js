import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getApiUrl } from '../config/environments.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { getRandomTripPayload } from '../helpers/payloads.js';
import { highThroughputThresholds } from '../config/thresholds.js';

const privateTripDuration = new Trend('trip_create_private_duration', true);
const publicTripDuration = new Trend('trip_create_public_queue_duration', true);
const errorRate = new Rate('trip_create_error_rate');
const tripsCreated = new Counter('trips_created_total');

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    ...highThroughputThresholds,
    trip_create_private_duration: ['p(50)<120', 'p(95)<300', 'p(99)<600'],
    trip_create_public_queue_duration: ['p(50)<150', 'p(95)<350', 'p(99)<700'],
    trip_create_error_rate: ['rate<0.02'],
  },
};

export function setup() {
  const authHeaders = getAuthHeaders('trip_creator');
  return { authHeaders };
}

export default function (data) {
  if (!data.authHeaders) return;

  // Alternate between private trip (pure DB write) and public trip (DB write + BullMQ enqueue)
  const isPublic = Math.random() > 0.5;
  const payload = JSON.stringify(getRandomTripPayload(isPublic));

  const start = Date.now();
  const res = http.post(getApiUrl('/trips'), payload, { headers: data.authHeaders });
  const duration = Date.now() - start;

  if (isPublic) {
    publicTripDuration.add(duration);
  } else {
    privateTripDuration.add(duration);
  }

  const passed = check(res, {
    'trip created (201)': (r) => r.status === 201,
    'has valid trip id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.trip && body.trip._id !== undefined;
      } catch (_) {
        return false;
      }
    },
  });

  if (passed) {
    tripsCreated.add(1);
    errorRate.add(0);
  } else {
    errorRate.add(1);
  }

  sleep(0.3); // Pacing
}

