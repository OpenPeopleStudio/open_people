#!/usr/bin/env node

/**
 * Queue worker scaffold for async processing (ai-analysis, thumbnail, notifications).
 * Uses BullMQ with a Redis backend. Ensure REDIS_URL is set or Redis is available locally.
 */

require('dotenv').config({ path: '.env.local' });
const { Queue, Worker, QueueEvents } = require('bullmq');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = { connection: { url: redisUrl } };

const queues = ['ai-analysis', 'thumbnail', 'notifications'];

function createQueue(name, handler, opts = {}) {
  const queue = new Queue(name, connection);
  const events = new QueueEvents(name, connection);
  events.on('error', (err) => console.error(`[${name}] events error`, err));

  const worker = new Worker(
    name,
    async (job) => {
      await handler(job);
    },
    {
      ...connection,
      concurrency: opts.concurrency || 5,
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[${name}] completed job ${job.id}`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[${name}] failed job ${job?.id}`, err);
  });
  worker.on('error', (err) => {
    console.error(`[${name}] worker error`, err);
  });

  return { queue, worker, events };
}

const aiHandler = async (job) => {
  const { tenantId, fileId, source } = job.data || {};
  console.log(`[ai-analysis] start job ${job.id} tenant=${tenantId} file=${fileId} source=${source}`);
  // TODO: fetch file, run AI pipeline, persist results/status in Postgres
};

const thumbnailHandler = async (job) => {
  const { tenantId, fileId } = job.data || {};
  console.log(`[thumbnail] start job ${job.id} tenant=${tenantId} file=${fileId}`);
  // TODO: generate thumbnails, persist status in Postgres/storage
};

const notifyHandler = async (job) => {
  const { tenantId, target, template } = job.data || {};
  console.log(`[notifications] start job ${job.id} tenant=${tenantId} target=${target} template=${template}`);
  // TODO: send notification/email/webhook
};

function main() {
  console.log(`Starting workers against ${redisUrl}`);
  createQueue('ai-analysis', aiHandler, { concurrency: 3 });
  createQueue('thumbnail', thumbnailHandler, { concurrency: 2 });
  createQueue('notifications', notifyHandler, { concurrency: 5 });
}

main();
