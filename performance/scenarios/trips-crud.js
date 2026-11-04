import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getApiUrl } from '../config/environments.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { getRandomTripPayload } from '../helpers/payloads.js';
import { summaryTrendStats } from '../config/thresholds.js';
import { formatK6Summary } from '../helpers/summaryFormatter.js';

const tripCreateLatency = new Trend('api_trip_create_latency_ms', true);
const tripReadLatency = new Trend('api_trip_read_latency_ms', true);
const failureRate = new Rate('api_http_failure_rate');
const tripsVerified = new Counter('trips_verified_count');

export const options = {
  summaryTrendStats: summaryTrendStats,
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_duration: ['p(50)<500', 'p(95)<1800', 'p(99)<3000'],
    api_http_failure_rate: ['rate<0.01'],
  },
};

export function setup() {
  const authHeaders = getAuthHeaders('trips_crud_tester');
  return { authHeaders };
}

export default function (data) {
  if (!data.authHeaders) return;

  // 1. Create a trip with unique destination tag
  const uniqueTag = `Trip_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const tripPayload = getRandomTripPayload(false);
  tripPayload.destination = `Goa ${uniqueTag}`;

  const startCreate = Date.now();
  const createRes = http.post(getApiUrl('/trips'), JSON.stringify(tripPayload), {
    headers: data.authHeaders,
    tags: { name: 'create_trip' },
  });
  tripCreateLatency.add(Date.now() - startCreate);

  const createOk = check(createRes, {
    'trip created 201': (r) => r.status === 201,
    'trip has id': (r) => {
      try {
        return JSON.parse(r.body).trip._id !== undefined;
      } catch (_) {
        return false;
      }
    },
  });
  failureRate.add(createOk ? 0 : 1);

  let createdId = null;
  try {
    createdId = JSON.parse(createRes.body).trip._id;
  } catch (_) {}

  // 2. Retrieve user's trips and verify the created trip is present
  const startRead = Date.now();
  const listRes = http.get(getApiUrl('/trips'), {
    headers: data.authHeaders,
    tags: { name: 'get_my_trips' },
  });
  tripReadLatency.add(Date.now() - startRead);

  const listOk = check(listRes, {
    'get trips 200': (r) => r.status === 200,
    'created trip exists in list': (r) => {
      try {
        const body = JSON.parse(r.body);
        if (!Array.isArray(body.trips)) return false;
        return body.trips.some((t) => t._id === createdId || t.destination === tripPayload.destination);
      } catch (_) {
        return false;
      }
    },
  });
  failureRate.add(listOk ? 0 : 1);

  if (createOk && listOk) {
    tripsVerified.add(1);
  }

  sleep(0.4);
}

export function handleSummary(data) {
  return formatK6Summary(data, 'TRIP CREATION & RETRIEVAL (CRUD) REPORT');
}

