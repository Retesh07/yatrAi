import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getApiUrl } from '../config/environments.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { getRandomTripPayload } from '../helpers/payloads.js';
import { summaryTrendStats } from '../config/thresholds.js';
import { formatK6Summary } from '../helpers/summaryFormatter.js';

// ==========================================
// 1. PRIORITIZED METRIC DEFINITIONS (k6)
// ==========================================

// Separate API response latency from AI generation latency
const tripReadLatency = new Trend('api_trip_read_latency_ms', true);
const tripCreateLatency = new Trend('api_trip_create_latency_ms', true);
const aiGenerationLatency = new Trend('ai_itinerary_generation_ms', true);

const httpFailureRate = new Rate('api_http_failure_rate');
const requestCounter = new Counter('api_requests_total');

export const options = {
  summaryTrendStats: summaryTrendStats,
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_duration: ['p(95)<2500', 'p(99)<3500'],
    api_http_failure_rate: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const authHeaders = getAuthHeaders('prioritized_tester');
  return { authHeaders };
}

export default function (data) {
  if (!data.authHeaders) return;

  // -------------------------------------------------------------
  // Test 1: Trip Creation (POST /api/v1/trips) -> Pure API latency
  // -------------------------------------------------------------
  const payload = JSON.stringify(getRandomTripPayload(true)); // isPublic: true triggers BullMQ
  const startCreate = Date.now();
  const createRes = http.post(getApiUrl('/trips'), payload, {
    headers: data.authHeaders,
    tags: { name: 'create_trip' },
  });
  const createDuration = Date.now() - startCreate;

  tripCreateLatency.add(createDuration);
  requestCounter.add(1);

  const createPassed = check(createRes, {
    'create trip 201': (r) => r.status === 201,
  });
  httpFailureRate.add(createPassed ? 0 : 1);

  let createdTripId = null;
  try {
    const body = JSON.parse(createRes.body);
    createdTripId = body?.trip?._id;
  } catch (_) {}

  // -------------------------------------------------------------
  // Test 2: Authenticated Trip Retrieval (GET /api/v1/trips)
  // -------------------------------------------------------------
  const startRead = Date.now();
  const readRes = http.get(getApiUrl('/trips'), {
    headers: data.authHeaders,
    tags: { name: 'get_my_trips' },
  });
  const readDuration = Date.now() - startRead;

  tripReadLatency.add(readDuration);
  requestCounter.add(1);

  const readPassed = check(readRes, {
    'get trips 200': (r) => r.status === 200,
  });
  httpFailureRate.add(readPassed ? 0 : 1);

  // -------------------------------------------------------------
  // Test 3: AI Itinerary Generation (POST /api/v1/trips/:id/generate)
  // -------------------------------------------------------------
  if (createdTripId) {
    const startGen = Date.now();
    const genRes = http.post(
      getApiUrl(`/trips/${createdTripId}/generate`),
      null,
      {
        headers: { ...data.authHeaders, 'x-perf-mock': 'true' },
        tags: { name: 'generate_itinerary' },
        timeout: '25s',
      }
    );
    const genDuration = Date.now() - startGen;

    aiGenerationLatency.add(genDuration);
    requestCounter.add(1);

    const genPassed = check(genRes, {
      'generate trip 200': (r) => r.status === 200,
    });
    httpFailureRate.add(genPassed ? 0 : 1);
  }

  sleep(0.5); // Pacing delay
}

export function handleSummary(data) {
  return {
    '../performance/temp-summary.json': JSON.stringify(data),
    'temp-summary.json': JSON.stringify(data),
  };
}
