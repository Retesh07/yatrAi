import http from 'k6/http';
import { check, sleep } from 'k6';
import { getBaseUrl, getApiUrl, getGraphQLUrl } from '../config/environments.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { getRandomTripPayload, GRAPHQL_QUERIES } from '../helpers/payloads.js';
import { summaryTrendStats } from '../config/thresholds.js';
import { formatK6Summary } from '../helpers/summaryFormatter.js';

export const options = {
  summaryTrendStats: summaryTrendStats,
  vus: 2,
  duration: '15s',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const authHeaders = getAuthHeaders('smoke_runner');
  return { authHeaders };
}

export default function (data) {
  // 1. Root Health Check
  const healthRes = http.get(getBaseUrl());
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health body valid': (r) => {
      try {
        return JSON.parse(r.body).message !== undefined;
      } catch (_) {
        return false;
      }
    },
  });

  // 2. Public Trips Feed
  const publicRes = http.get(getApiUrl('/trips/public'));
  check(publicRes, {
    'public trips status is 200': (r) => r.status === 200,
    'public trips is array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).trips);
      } catch (_) {
        return false;
      }
    },
  });

  // 3. Apollo GraphQL Endpoint
  const gqlRes = http.post(getGraphQLUrl(), GRAPHQL_QUERIES.publicTrips, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(gqlRes, {
    'graphql status is 200': (r) => r.status === 200,
    'graphql has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.publicTrips !== undefined;
      } catch (_) {
        return false;
      }
    },
  });

  // 4. Authenticated Trip Creation and Retrieval
  if (data.authHeaders) {
    const payload = JSON.stringify(getRandomTripPayload(false));
    const createRes = http.post(getApiUrl('/trips'), payload, {
      headers: data.authHeaders,
    });
    check(createRes, {
      'create trip is 201': (r) => r.status === 201,
      'has trip id': (r) => {
        try {
          return JSON.parse(createRes.body).trip._id !== undefined;
        } catch (_) {
          return false;
        }
      },
    });

    const getRes = http.get(getApiUrl('/trips'), { headers: data.authHeaders });
    check(getRes, {
      'get trips is 200': (r) => r.status === 200,
      'trips returned': (r) => {
        try {
          return JSON.parse(getRes.body).trips.length > 0;
        } catch (_) {
          return false;
        }
      },
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return formatK6Summary(data, 'SMOKE TEST REPORT (1-2 VUs)');
}
