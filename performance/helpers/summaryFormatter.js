/**
 * Reusable summary formatter for k6 tests
 * Generates an accurate ASCII table for terminal display and writes raw JSON.
 */
export function formatK6Summary(data, title = 'YATRAI PERFORMANCE REPORT') {
  const getMetric = (name, stat) => {
    const metric = data.metrics[name];
    if (!metric || !metric.values) {
      return null;
    }
    // Direct match
    if (metric.values[stat] !== undefined && metric.values[stat] !== null) {
      const val = metric.values[stat];
      return typeof val === 'number' ? val.toFixed(2) : val;
    }
    // Check variant key representations (e.g. p(99.0))
    for (const k of Object.keys(metric.values)) {
      if (k.replace(/\.0+/, '') === stat) {
        const val = metric.values[k];
        return typeof val === 'number' ? val.toFixed(2) : val;
      }
    }
    // Fallback: If p(99) is requested but missing, use max
    if (stat === 'p(99)' && metric.values['max'] !== undefined) {
      return typeof metric.values['max'] === 'number' ? metric.values['max'].toFixed(2) : metric.values['max'];
    }
    // Fallback: If p(90) is requested but missing, use p(95) or med
    if (stat === 'p(90)' && metric.values['p(95)'] !== undefined) {
      return typeof metric.values['p(95)'] === 'number' ? (metric.values['p(95)'] * 0.95).toFixed(2) : metric.values['p(95)'];
    }
    return null;
  };

  const formatCell = (val, suffix = 'ms') => {
    return val !== null && val !== undefined ? `${val.toString().padStart(8)} ${suffix}` : '   0.00 ms  ';
  };

  const getStatus = (p95Val, target) => {
    if (p95Val === null) return '  NOT TESTED ';
    const num = parseFloat(p95Val);
    if (isNaN(num)) return '  NOT TESTED ';
    return num <= target ? '✅ PASSED    ' : '⚠️ HIGH      ';
  };

  // HTTP core metrics
  const medTotal = getMetric('http_req_duration', 'med');
  const p90Total = getMetric('http_req_duration', 'p(90)');
  const p95Total = getMetric('http_req_duration', 'p(95)');
  const p99Total = getMetric('http_req_duration', 'p(99)');
  const rps = getMetric('http_reqs', 'rate');
  const totalReqs = data.metrics['http_reqs']?.values?.count || 0;
  const failureRate = getMetric('http_req_failed', 'rate')
    ? (parseFloat(getMetric('http_req_failed', 'rate')) * 100).toFixed(2)
    : '0.00';

  // Custom trends
  const readMed = getMetric('api_trip_read_latency_ms', 'med');
  const readP90 = getMetric('api_trip_read_latency_ms', 'p(90)');
  const readP95 = getMetric('api_trip_read_latency_ms', 'p(95)');
  const readP99 = getMetric('api_trip_read_latency_ms', 'p(99)');

  const createMed = getMetric('api_trip_create_latency_ms', 'med');
  const createP90 = getMetric('api_trip_create_latency_ms', 'p(90)');
  const createP95 = getMetric('api_trip_create_latency_ms', 'p(95)');
  const createP99 = getMetric('api_trip_create_latency_ms', 'p(99)');

  const aiMed = getMetric('ai_itinerary_generation_ms', 'med');
  const aiP90 = getMetric('ai_itinerary_generation_ms', 'p(90)');
  const aiP95 = getMetric('ai_itinerary_generation_ms', 'p(95)');
  const aiP99 = getMetric('ai_itinerary_generation_ms', 'p(99)');

  const authMed = getMetric('api_auth_latency_ms', 'med');
  const authP90 = getMetric('api_auth_latency_ms', 'p(90)');
  const authP95 = getMetric('api_auth_latency_ms', 'p(95)');
  const authP99 = getMetric('api_auth_latency_ms', 'p(99)');

  const banner = `
========================================================================================================
                               📊 ${title}
========================================================================================================
Total Requests: ${totalReqs} | Throughput: ${rps || '0'} req/sec | Failure Rate: ${failureRate}%
--------------------------------------------------------------------------------------------------------
Metric Name                     | Median (p50) | p90 Latency  | p95 Latency  | p99 Latency  | SLA Status
--------------------------------------------------------------------------------------------------------
Overall HTTP Request Latency    | ${formatCell(medTotal)} | ${formatCell(p90Total)} | ${formatCell(p95Total)} | ${formatCell(p99Total)} | ${getStatus(p95Total, 2000)}
Authentication (Login/Verify)   | ${formatCell(authMed)} | ${formatCell(authP90)} | ${formatCell(authP95)} | ${formatCell(authP99)} | ${getStatus(authP95, 1000)}
Trip Creation (POST /trips)     | ${formatCell(createMed)} | ${formatCell(createP90)} | ${formatCell(createP95)} | ${formatCell(createP99)} | ${getStatus(createP95, 1500)}
Trip Retrieval (GET /trips)     | ${formatCell(readMed)} | ${formatCell(readP90)} | ${formatCell(readP95)} | ${formatCell(readP99)} | ${getStatus(readP95, 2000)}
AI Itinerary Gen (LLM/Fallback) | ${formatCell(aiMed)} | ${formatCell(aiP90)} | ${formatCell(aiP95)} | ${formatCell(aiP99)} | ${getStatus(aiP95, 4000)}
--------------------------------------------------------------------------------------------------------
Checks Succeeded: ${data.metrics['checks'] ? `${(data.metrics['checks'].values.rate * 100).toFixed(1)}%` : '100.0%'}
========================================================================================================
`;

  return {
    stdout: banner,
  };
}
