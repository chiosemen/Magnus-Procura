import { Router } from 'express';
import { z } from 'zod';

import { BadRequestError, HttpError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { db } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { buildEvent, enqueueScoringJob, type ScoringEventType } from 'agent-tool-scoring';

export const scoringRoutes = Router();

const triggerSchema = z.object({
  entityId: z.string().min(1),
  eventType: z.enum([
    'SUPPLIER_PROFILE_UPDATED',
    'DOCUMENT_UPLOADED',
    'CREDENTIAL_EXPIRED',
    'EXTERNAL_SYNC_UPDATED',
    'ADMIN_OVERRIDE'
  ] as const),
  payload: z.unknown()
});

scoringRoutes.post('/trigger', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const parsed = triggerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError('Invalid scoring trigger request');
    }

    const eventType: ScoringEventType = parsed.data.eventType;

    const event = buildEvent({
      entityId: parsed.data.entityId,
      eventType,
      payload: parsed.data.payload,
      triggeredBy: {
        username: req.auth!.username,
        role: req.auth!.role
      }
    });

    const { job, created, idempotencyKey } = await enqueueScoringJob(db, event);

    if (!created && job.status === 'completed') {
      logger.info(
        { jobId: job.id, entityId: job.entity_id, eventType: job.event_type, idempotencyKey },
        'job_skipped_duplicate'
      );

      res.status(200).json({
        jobId: job.id,
        idempotencyKey,
        status: job.status,
        deduped: true
      });
      return;
    }

    if (job.status === 'dead') {
      throw new HttpError(409, 'SCORING_JOB_DEAD', 'Scoring job is dead-lettered; change payload to produce a new idempotency key');
    }

    logger.info(
      { jobId: job.id, entityId: job.entity_id, eventType: job.event_type, idempotencyKey, deduped: !created, status: job.status },
      'scoring_job_enqueued'
    );

    res.status(202).json({
      jobId: job.id,
      idempotencyKey,
      status: job.status,
      deduped: !created
    });
  } catch (error) {
    next(error);
  }
});
