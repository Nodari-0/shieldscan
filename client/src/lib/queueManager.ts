/**
 * Queue Manager
 * - Uses BullMQ + Redis if configured
 * - Falls back to in-memory queue otherwise
 */

import type { Job } from 'bullmq';

const hasRedis =
  !!process.env.UPSTASH_REDIS_URL ||
  !!process.env.REDIS_URL;

// ------------------------
// BullMQ implementation
// ------------------------
let bullQueue: any = null;
let bullWorker: any = null;
let processorRegistered = false;

async function ensureBullQueue() {
  if (!hasRedis || bullQueue) return;
  const { Queue, Worker } = await import('bullmq');
  const Redis = (await import('ioredis')).default;

  const connection = new Redis(
    process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL!,
    {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: process.env.UPSTASH_REDIS_URL ? {} : undefined,
      password: process.env.UPSTASH_REDIS_TOKEN,
    }
  );

  bullQueue = new Queue('scan-jobs', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 172800 },
    },
  });

  // Worker is created when a processor is registered
  bullWorker = { connection, Queue, Worker };
}

// ------------------------
// In-memory fallback
// ------------------------
interface QueueJob {
  id: string;
  type: 'scan' | 'notification' | 'export' | 'cleanup';
  priority: number;
  data: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledFor?: Date;
}

class SimpleQueue {
  private queue: QueueJob[] = [];
  private processing = false;
  private processors: Map<string, (job: QueueJob) => Promise<void>> = new Map();

  constructor() {
    setInterval(() => this.cleanup(), 60000);
  }

  async add(job: Omit<QueueJob, 'id' | 'attempts' | 'createdAt'>): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queueJob: QueueJob = {
      ...job,
      id,
      attempts: 0,
      createdAt: new Date(),
    };

    this.queue.push(queueJob);
    this.queue.sort((a, b) => b.priority - a.priority);

    if (!this.processing) {
      this.process();
    }

    return id;
  }

  registerProcessor(type: string, processor: (job: QueueJob) => Promise<void>) {
    this.processors.set(type, processor);
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      if (job.scheduledFor && job.scheduledFor > new Date()) {
        this.queue.push(job);
        continue;
      }

      const processor = this.processors.get(job.type);
      if (!processor) {
        console.warn(`No processor found for job type: ${job.type}`);
        continue;
      }

      try {
        job.attempts++;
        await processor(job);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        if (job.attempts < job.maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, job.attempts), 30000);
          job.scheduledFor = new Date(Date.now() + delay);
          this.queue.push(job);
        }
      }
    }

    this.processing = false;
  }

  private cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.queue = this.queue.filter(
      job => job.createdAt.getTime() > oneHourAgo || job.scheduledFor
    );
  }

  getStats() {
    return {
      pending: this.queue.length,
      processing: this.processing,
      byType: this.queue.reduce((acc, job) => {
        acc[job.type] = (acc[job.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

const fallbackQueue = new SimpleQueue();

// ------------------------
// Public API
// ------------------------
export async function queueScan(params: {
  userId: string;
  userEmail: string;
  url: string;
  plan: string;
  tags?: string[];
}): Promise<string> {
  const priorities: Record<string, number> = {
    enterprise: 100,
    business: 75,
    pro: 50,
    free: 25,
  };

  if (hasRedis) {
    await ensureBullQueue();
    const priority = priorities[params.plan] || 25;
    const job = await bullQueue.add('scan', params, {
      priority,
    });
    return job.id as string;
  }

  return fallbackQueue.add({
    type: 'scan',
    priority: priorities[params.plan] || 25,
    data: params,
    maxAttempts: 3,
  });
}

export function registerScanProcessor(
  processor: (data: {
    userId: string;
    userEmail: string;
    url: string;
    plan: string;
    tags?: string[];
  }) => Promise<void>
) {
  if (hasRedis) {
    // BullMQ worker
    if (processorRegistered) return;
    processorRegistered = true;
    ensureBullQueue().then(async () => {
      const { Worker } = await import('bullmq');
      const Redis = (await import('ioredis')).default;
      const connection = new Redis(
        process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL!,
        {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          tls: process.env.UPSTASH_REDIS_URL ? {} : undefined,
          password: process.env.UPSTASH_REDIS_TOKEN,
        }
      );

      new Worker(
        'scan-jobs',
        async (job: Job) => {
          await processor(job.data as any);
        },
        {
          connection,
          concurrency: 5,
        }
      );
    });
  } else {
    fallbackQueue.registerProcessor('scan', async (job) => {
      await processor(job.data as any);
    });
  }
}

