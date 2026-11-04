class MockQueue {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.jobs = [];
    this.isClosed = false;
  }

  async add(name, data, opts) {
    if (this.shouldFail) {
      throw new Error('Redis connection lost: ECONNREFUSED');
    }
    const job = { id: `job-${Date.now()}-${Math.random()}`, name, data, opts };
    this.jobs.push(job);
    return job;
  }

  async close() {
    this.isClosed = true;
  }
}

class MockWorker {
  constructor(name, processor, config) {
    this.name = name;
    this.processor = processor;
    this.config = config;
    this.isClosed = false;
  }

  async close() {
    this.isClosed = true;
  }
}

class MockQueueScheduler {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  async close() {}
}

module.exports = {
  MockQueue,
  MockWorker,
  MockQueueScheduler,
};
