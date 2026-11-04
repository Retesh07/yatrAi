/**
 * BullMQ Direct Queue Performance & Latency Benchmark
 * 
 * Measures:
 * 1. Job Enqueue Latency (t_enqueued - t_start)
 * 2. Queue Waiting Time (job.processedOn - job.timestamp)
 * 3. Worker Processing Duration (job.finishedOn - job.processedOn)
 * 4. End-to-End Job Completion Time (job.finishedOn - job.timestamp)
 * 5. Job Success Rate, Failure Rate, Retry Count, and Queue Depth
 *
 * Run via: node performance/helpers/queueBenchmark.js
 */
const path = require('path');
const serverModules = path.join(__dirname, '../../server/node_modules');
const { Queue, Worker } = require(path.join(serverModules, 'bullmq'));
const { performance } = require('perf_hooks');
const dotenv = require(path.join(serverModules, 'dotenv'));

dotenv.config({ path: path.join(__dirname, '../../server/.env') });

const redisConfig = {
  connection: process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
  },
};

const QUEUE_NAME = 'perf-benchmark-queue';
const TOTAL_JOBS = Number(process.env.JOBS || 100);
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || 5);

function calculatePercentiles(values) {
  if (!values.length) return { p50: '0.00', p90: '0.00', p95: '0.00', p99: '0.00', avg: '0.00' };
  const sorted = [...values].sort((a, b) => a - b);
  const p = (pct) => sorted[Math.min(Math.floor((pct / 100) * sorted.length), sorted.length - 1)];
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return {
    p50: p(50).toFixed(2),
    p90: p(90).toFixed(2),
    p95: p(95).toFixed(2),
    p99: p(99).toFixed(2),
    avg: avg.toFixed(2),
  };
}

async function runQueueBenchmark() {
  console.log(`\n========================================================================`);
  console.log(`🚀 BullMQ + Redis Queue Performance & Lifecycle Benchmark`);
  console.log(`Jobs: ${TOTAL_JOBS} | Concurrency: ${CONCURRENCY} | Host: ${redisConfig.connection.host || 'URL'}`);
  console.log(`========================================================================\n`);

  const queue = new Queue(QUEUE_NAME, redisConfig);

  // Test Redis connection first
  try {
    const client = await queue.client;
    await client.ping();
  } catch (connErr) {
    console.error(`❌ Redis connection failed (${redisConfig.connection.host || '127.0.0.1'}:6379): ${connErr.message}`);
    console.error(`Please ensure Redis is running (e.g. docker run -d -p 6379:6379 redis:alpine)`);
    process.exit(1);
  }

  const enqueueLatencies = [];
  const queueWaitingTimes = [];
  const processingDurations = [];
  const endToEndTimes = [];
  let successfulJobs = 0;
  let failedJobs = 0;
  let totalRetries = 0;

  // Set up Worker
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      // Worker picked up job
      const workerStarted = performance.now();

      // Simulate representative job workload (social notifications, Mongoose populate)
      await new Promise((r) => setTimeout(r, 8));

      const workerFinished = performance.now();
      const procDuration = workerFinished - workerStarted;

      // Actual wait time (from enqueue time to worker start)
      const waitTime = Math.max(0, workerStarted - job.data.enqueuedAtMs);
      const e2eTime = workerFinished - job.data.startedAtMs;

      queueWaitingTimes.push(waitTime);
      processingDurations.push(procDuration);
      endToEndTimes.push(e2eTime);
      totalRetries += job.attemptsMade;
      successfulJobs++;
    },
    { ...redisConfig, concurrency: CONCURRENCY }
  );

  worker.on('failed', (job, err) => {
    failedJobs++;
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  const benchmarkStart = performance.now();

  // Enqueue jobs and measure enqueue latency
  console.log(`1. Enqueuing ${TOTAL_JOBS} jobs into '${QUEUE_NAME}'...`);
  for (let i = 0; i < TOTAL_JOBS; i++) {
    const startedAtMs = performance.now();
    await queue.add('perf-job', {
      index: i,
      startedAtMs,
      enqueuedAtMs: performance.now(),
    });
    const enqueuedAtMs = performance.now();
    enqueueLatencies.push(enqueuedAtMs - startedAtMs);
  }

  // Queue depth snapshot immediately after enqueuing
  const queueCounts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed');
  console.log(`2. Queue depth after enqueue: waiting=${queueCounts.waiting}, active=${queueCounts.active}`);

  // Wait for all jobs to complete
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (successfulJobs + failedJobs >= TOTAL_JOBS) {
        clearInterval(interval);
        resolve();
      }
    }, 25);
  });

  const totalTimeMs = performance.now() - benchmarkStart;
  const throughput = ((TOTAL_JOBS / totalTimeMs) * 1000).toFixed(2);

  // Stats calculation
  const enqueueStats = calculatePercentiles(enqueueLatencies);
  const waitStats = calculatePercentiles(queueWaitingTimes);
  const procStats = calculatePercentiles(processingDurations);
  const e2eStats = calculatePercentiles(endToEndTimes);

  console.log(`\n========================================================================================`);
  console.log(`                         📊 BULLMQ JOB METRICS REPORT`);
  console.log(`========================================================================================`);
  console.log(`Total Jobs: ${TOTAL_JOBS} | Throughput: ${throughput} jobs/sec | Success Rate: ${((successfulJobs / TOTAL_JOBS) * 100).toFixed(1)}%`);
  console.log(`----------------------------------------------------------------------------------------`);
  console.log(`Lifecycle Metric                | Median (p50) | p90 Latency  | p95 Latency  | p99 Latency`);
  console.log(`----------------------------------------------------------------------------------------`);
  console.log(`1. Job Enqueue Latency          | ${enqueueStats.p50.padStart(8)} ms | ${enqueueStats.p90.padStart(8)} ms | ${enqueueStats.p95.padStart(8)} ms | ${enqueueStats.p99.padStart(8)} ms`);
  console.log(`2. Queue Wait Time (idle)       | ${waitStats.p50.padStart(8)} ms | ${waitStats.p90.padStart(8)} ms | ${waitStats.p95.padStart(8)} ms | ${waitStats.p99.padStart(8)} ms`);
  console.log(`3. Worker Processing Duration   | ${procStats.p50.padStart(8)} ms | ${procStats.p90.padStart(8)} ms | ${procStats.p95.padStart(8)} ms | ${procStats.p99.padStart(8)} ms`);
  console.log(`4. End-to-End Completion Time   | ${e2eStats.p50.padStart(8)} ms | ${e2eStats.p90.padStart(8)} ms | ${e2eStats.p95.padStart(8)} ms | ${e2eStats.p99.padStart(8)} ms`);
  console.log(`----------------------------------------------------------------------------------------`);
  console.log(`Completed: ${successfulJobs} | Failed: ${failedJobs} | Total Retries: ${totalRetries} | Peak Queue Depth: ${queueCounts.waiting}`);
  console.log(`========================================================================================\n`);

  await worker.close();
  await queue.obliterate({ force: true });
  await queue.close();
  process.exit(0);
}

runQueueBenchmark().catch((err) => {
  console.error('Queue benchmark fatal error:', err.message);
  process.exit(1);
});
