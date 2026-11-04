/**
 * Global SLA and SLO Performance Thresholds for YatrAI k6 Load Tests
 */

// Critical: include p(99) so k6 computes it in data.metrics
export const summaryTrendStats = ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'];

export const baseThresholds = {
  // 95% of requests must complete within 350ms; 99% within 750ms
  http_req_duration: ['p(50)<150', 'p(95)<350', 'p(99)<750'],
  // HTTP failure/error rate must remain under 1%
  http_req_failed: ['rate<0.01'],
};

export const highThroughputThresholds = {
  // Relaxed thresholds for heavy DB writes or 50 VU stress tests
  http_req_duration: ['p(50)<250', 'p(95)<600', 'p(99)<1200'],
  http_req_failed: ['rate<0.02'],
};

export const graphqlThresholds = {
  // Apollo GraphQL query processing overhead
  http_req_duration: ['p(50)<150', 'p(95)<400', 'p(99)<800'],
  http_req_failed: ['rate<0.01'],
};
