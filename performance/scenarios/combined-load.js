import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getBaseUrl, getApiUrl, getGraphQLUrl } from '../config/environments.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { getRandomTripPayload, GRAPHQL_QUERIES } from '../helpers/payloads.js';

// Custom metric trends for each critical path
const readLatency = new Trend('path_trip_read_duration', true);
const writeLatency = new Trend('path_trip_create_duration', true);
const graphqlLatency = new Trend('path_graphql_duration', true);
const publicLatency = new Trend('path_public_feed_duration', true);

// Failure and status code tracking
const errorRate = new Rate('system_error_rate');
const status2xx = new Counter('status_code_2xx');
const status4xx = new Counter('status_code_4xx');
const status5xx = new Counter('status_code_5xx');

// Determine scenario configuration from environment variables
const targetVUs = Number(__ENV.VUS || 10);
const isRamping = __ENV.SCENARIO === 'ramping';

export const options = isRamping
  ? {
      // Step-ladder stress test: gradually increase load from 10 -> 25 -> 50 VUs
      stages: [
        { duration: '20s', target: 10 }, // Ramp to 10 VUs
        { duration: '30s', target: 10 }, // Sustained 10 VUs
        { duration: '20s', target: 25 }, // Ramp to 25 VUs
        { duration: '30s', target: 25 }, // Sustained 25 VUs
        { duration: '20s', target: 50 }, // Ramp to 50 VUs (Peak Stress)
        { duration: '40s', target: 50 }, // Sustained 50 VUs
        { duration: '20s', target: 0 },  // Cool-down & recovery
      ],
      thresholds: {
        http_req_duration: ['p(50)<150', 'p(95)<400', 'p(99)<800'],
        system_error_rate: ['rate<0.02'],
      },
    }
  : {
      // Constant sustained load test
      vus: targetVUs,
      duration: __ENV.DURATION || '60s',
      thresholds: {
        http_req_duration: ['p(50)<120', 'p(95)<300', 'p(99)<600'],
        system_error_rate: ['rate<0.01'],
      },
    };

export function setup() {
  console.log(`Setting up test credentials for combined load test (${targetVUs} VUs)...`);
  const authHeaders = getAuthHeaders('combined_runner');
  return { authHeaders };
}

export default function (data) {
  // Realistic user behavior distribution
  const rand = Math.random();

  let res;
  let tag = '';

  if (rand < 0.40) {
    // 40% of traffic: Public trip feed
    tag = 'public_feed';
    const start = Date.now();
    res = http.get(getApiUrl('/trips/public'), { tags: { name: tag } });
    publicLatency.add(Date.now() - start);

    check(res, { 'public feed status is 200': (r) => r.status === 200 });

  } else if (rand < 0.70) {
    // 30% of traffic: Authenticated trip retrieval
    tag = 'auth_trips_read';
    if (data.authHeaders) {
      const start = Date.now();
      res = http.get(getApiUrl('/trips'), {
        headers: data.authHeaders,
        tags: { name: tag },
      });
      readLatency.add(Date.now() - start);

      check(res, { 'my trips status is 200': (r) => r.status === 200 });
    }

  } else if (rand < 0.85) {
    // 15% of traffic: Apollo GraphQL query
    tag = 'graphql_query';
    const start = Date.now();
    res = http.post(getGraphQLUrl(), GRAPHQL_QUERIES.publicTrips, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: tag },
    });
    graphqlLatency.add(Date.now() - start);

    check(res, { 'graphql status is 200': (r) => r.status === 200 });

  } else if (rand < 0.95) {
    // 10% of traffic: Create trip (DB write + BullMQ enqueue)
    tag = 'trip_create';
    if (data.authHeaders) {
      const payload = JSON.stringify(getRandomTripPayload(true));
      const start = Date.now();
      res = http.post(getApiUrl('/trips'), payload, {
        headers: data.authHeaders,
        tags: { name: tag },
      });
      writeLatency.add(Date.now() - start);

      check(res, { 'trip created status is 201': (r) => r.status === 201 });
    }

  } else {
    // 5% of traffic: Health check
    tag = 'health_ping';
    res = http.get(getBaseUrl(), { tags: { name: tag } });
    check(res, { 'health check status is 200': (r) => r.status === 200 });
  }

  // Record status codes
  if (res) {
    if (res.status >= 200 && res.status < 300) {
      status2xx.add(1);
      errorRate.add(0);
    } else if (res.status >= 400 && res.status < 500) {
      status4xx.add(1);
      errorRate.add(0); // 4xx client errors tracked separately
    } else if (res.status >= 500) {
      status5xx.add(1);
      errorRate.add(1);
    }
  }

  // Realistic user think time between actions (100ms - 400ms)
  sleep(0.1 + Math.random() * 0.3);
}

export function teardown() {
  console.log('Test execution completed. Run `node performance/helpers/dataCleanup.js` to purge test data.');
}

