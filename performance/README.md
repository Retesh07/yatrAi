# YatrAI Backend Performance Testing Suite (k6) 🚀

A comprehensive, production-grade load, stress, spike, soak, and queue benchmarking suite for the YatrAI backend.

---

## 📁 Directory Structure

```
performance/
├── config/
│   ├── environments.js          # Base URL and endpoint resolution
│   └── thresholds.js            # Reusable SLO/SLA rules & summaryTrendStats (p90, p95, p99)
├── helpers/
│   ├── auth.js                  # Automated JWT login/registration helper for test VUs
│   ├── payloads.js              # Realistic trip generation data & GraphQL queries
│   ├── summaryFormatter.js      # Formats clean terminal ASCII tables & handles metric stats
│   ├── dataCleanup.js           # Purges load-test users and trips from MongoDB
│   └── queueBenchmark.js        # BullMQ lifecycle benchmark (enqueue, wait, worker duration, e2e)
└── scenarios/
    ├── smoke.js                 # A. Smoke test (1-2 VUs sanity check across all routes)
    ├── api-load.js              # B. Core API load test (login, trip CRUD, configurable VUs)
    ├── auth-flow.js             # C. Authentication & JWT lifecycle (valid, invalid, refresh, expiry)
    ├── trips-crud.js            # D. Trip creation & retrieval consistency
    ├── prioritized-metrics.js   # Master benchmark collecting the 8 prioritized metrics
    ├── stress.js                # F. Step-ladder stress test (5 -> 75 VUs degradation curve)
    ├── spike.js                 # G. Traffic surge & rapid recovery test (2 -> 40 -> 2 VUs)
    ├── soak.js                  # H. Extended duration soak test (endurance & memory drift)
    ├── public-trips.js          # High-concurrency public feed benchmark
    ├── health.js                # Raw framework throughput baseline (GET /)
    └── graphql.js               # Apollo Server GraphQL engine overhead benchmark
```

---

## 🛠️ Installation of k6

### Windows
```powershell
winget install k6 --source winget
# Refresh PATH in current PowerShell:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### macOS
```bash
brew install k6
```

### Linux (Ubuntu/Debian)
```bash
sudo snap install k6
```

---

## 🚦 Execution Commands

Ensure your backend server is running in a separate terminal:
```bash
cd server
npm start
```

### Phase 1: Core Scenarios

#### 1. Smoke Test (A: 1–2 VUs, 15s Sanity Check)
```bash
k6 run ../performance/scenarios/smoke.js
```

#### 2. API Load Test (B: Configurable VUs & Duration)
```bash
k6 run ../performance/scenarios/api-load.js
# Or with custom load:
k6 run -e VUS=25 -e DURATION=1m ../performance/scenarios/api-load.js
```

#### 3. Authentication & JWT Lifecycle Test (C: Valid, Invalid, Cookie Rotation)
```bash
k6 run ../performance/scenarios/auth-flow.js
```

#### 4. Trip Creation & Retrieval CRUD Test (D: Consistency & Document Retrieval)
```bash
k6 run ../performance/scenarios/trips-crud.js
```

#### 5. Master Prioritized Metrics Benchmark (API + End-to-End Generation)
```bash
k6 run ../performance/scenarios/prioritized-metrics.js
```

#### 6. BullMQ + Redis Queue Lifecycle Benchmark (E: Waiting time, Worker, E2E)
```bash
node ../performance/helpers/queueBenchmark.js
```

### Phase 2: Stress, Spike & Soak Scenarios

#### 7. Stress Test (F: Step-Ladder 5 $\rightarrow$ 75 VUs)
```bash
k6 run ../performance/scenarios/stress.js
```

#### 8. Traffic Spike Test (G: Sudden Surge 2 $\rightarrow$ 40 $\rightarrow$ 2 VUs)
```bash
k6 run ../performance/scenarios/spike.js
```

#### 9. Soak Test (H: Extended Endurance Load, Default 15m)
```bash
k6 run ../performance/scenarios/soak.js
# Or 30 minutes:
k6 run -e DURATION=30m ../performance/scenarios/soak.js
```

---

## 📄 Exporting Raw JSON Output

To export raw metric numbers to a JSON file for CI or historical comparisons:
```bash
k6 run --summary-export=summary.json ../performance/scenarios/prioritized-metrics.js
```

---

## 🔍 Bottleneck Analysis: Why `GET /trips` Has Higher Latency

During load testing, `GET /api/v1/trips` showed a median latency of ~1.78s under 10 concurrent VUs. The root causes identified during codebase inspection are:

1. **Payload Size & Over-fetching**:
   - `Trip.find({ user: req.user.id })` in `tripController.js` currently uses **no projection (`select`)**.
   - It fetches the **complete, deeply nested itinerary** for every trip the user owns (including `days`, `events`, `hotels`, `restaurants`, `budgetBreakdown`, `emergencyInformation`, and `mustVisitPlaces`).
   - As test users accumulate multiple trips, each HTTP response transfers **~200 KB+** of uncompressed JSON over MongoDB Atlas network per request!
2. **Missing Compound Sort Index**:
   - `models/Trip.js` has an index on `{ user: 1 }`, but `getMyTrips` executes `.sort({ createdAt: -1 })`.
   - Without a compound index on `{ user: 1, createdAt: -1 }`, MongoDB must pull all documents into RAM to perform an in-memory sort stage.

### Recommended Future Optimization (When ready to optimize):
1. **Add Field Projection**: Change `getMyTrips` to select only summary card fields needed by the dashboard:
   `.select('destination startDate endDate people budget status createdAt isPublic estimatedCost')`
   *(Reduces payload size by >90% from ~200 KB down to ~2 KB).*
2. **Compound Index**:
   `tripSchema.index({ user: 1, createdAt: -1 });`
