/**
 * Standalone worker process for Railway Worker service
 * Executes periodic job ticks or processes background queues
 */
import dotenv from 'dotenv';
dotenv.config();

console.log('[Worker] Magnus Procura cron worker initialized.');

const API_BASE = process.env.INTERNAL_API_URL || `http://localhost:${process.env.PORT || 8787}`;
const CRON_SECRET = process.env.CRON_SECRET || '';

async function runJob(jobName: string, path: string) {
  console.log(`[Worker] Running scheduled job: ${jobName} at ${new Date().toISOString()}`);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });
    const result = await res.json();
    console.log(`[Worker] Job ${jobName} completed:`, result);
  } catch (err) {
    console.error(`[Worker] Job ${jobName} encountered error:`, err);
  }
}

// If invoked with a specific job argument (e.g. node dist/jobs/worker.js tick-sla)
const targetJob = process.argv[2];
if (targetJob) {
  void runJob(targetJob, `/jobs/${targetJob}`).then(() => {
    process.exit(0);
  });
} else {
  console.log('[Worker] No target job argument passed. Worker running in idle standby mode.');
}
