import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getGraphQLUrl } from '../config/environments.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { GRAPHQL_QUERIES } from '../helpers/payloads.js';
import { graphqlThresholds } from '../config/thresholds.js';

const gqlDuration = new Trend('graphql_req_duration', true);
const errorRate = new Rate('graphql_error_rate');
const queriesTotal = new Counter('graphql_queries_total');

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    ...graphqlThresholds,
    graphql_req_duration: ['p(50)<100', 'p(95)<250', 'p(99)<500'],
    graphql_error_rate: ['rate<0.01'],
  },
};

export function setup() {
  const authHeaders = getAuthHeaders('graphql_bench');
  return { authHeaders };
}

export default function (data) {
  // Query 1: Public trips query via GraphQL
  const start = Date.now();
  const res = http.post(getGraphQLUrl(), GRAPHQL_QUERIES.publicTrips, {
    headers: { 'Content-Type': 'application/json' },
  });
  const duration = Date.now() - start;

  gqlDuration.add(duration);
  queriesTotal.add(1);

  const passed = check(res, {
    'status is 200': (r) => r.status === 200,
    'has data.publicTrips': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.data && Array.isArray(body.data.publicTrips);
      } catch (_) {
        return false;
      }
    },
    'no graphql errors': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !body.errors;
      } catch (_) {
        return false;
      }
    },
  });

  errorRate.add(passed ? 0 : 1);

  // Query 2: Authenticated user trips via GraphQL
  if (data.authHeaders) {
    http.post(getGraphQLUrl(), GRAPHQL_QUERIES.myTrips, {
      headers: data.authHeaders,
    });
  }

  sleep(0.2); // Pacing
}

