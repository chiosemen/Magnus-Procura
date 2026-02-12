import type { DbClient, Logger, Network, SyndicationJobRecord } from './types.js';

export type AuditAction =
  | 'SYNDICATION_ENQUEUED'
  | 'SYNDICATION_ATTEMPT'
  | 'SYNDICATION_SUCCESS'
  | 'SYNDICATION_FAILED'
  | 'SYNDICATION_DEAD_LETTER';

export const writeAudit = async (db: DbClient, args: { job: SyndicationJobRecord; action: AuditAction; payload: unknown }): Promise<void> => {
  await db.query(
    `INSERT INTO syndication_audit (job_id, supplier_id, network, idempotency_key, action, payload)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [args.job.id, args.job.supplier_id, args.job.network, args.job.idempotency_key, args.action, JSON.stringify(args.payload)]
  );
};

export const logEnqueued = (
  logger: Logger,
  args: { job: SyndicationJobRecord; network: Network; supplierId: string; payloadHash: string; created: boolean }
): void => {
  logger.info(
    {
      jobId: args.job.id,
      supplierId: args.supplierId,
      network: args.network,
      idempotencyKey: args.job.idempotency_key,
      payloadHash: args.payloadHash,
      created: args.created
    },
    'syndication_enqueued'
  );
};

export const logAttempt = (logger: Logger, args: { job: SyndicationJobRecord; attempt: number }): void => {
  logger.info(
    {
      jobId: args.job.id,
      supplierId: args.job.supplier_id,
      network: args.job.network,
      idempotencyKey: args.job.idempotency_key,
      attempt: args.attempt
    },
    'syndication_attempt'
  );
};

export const logSuccess = (logger: Logger, args: { job: SyndicationJobRecord; externalId?: string }): void => {
  logger.info(
    {
      jobId: args.job.id,
      supplierId: args.job.supplier_id,
      network: args.job.network,
      idempotencyKey: args.job.idempotency_key,
      externalId: args.externalId ?? null
    },
    'syndication_success'
  );
};

export const logFailed = (logger: Logger, args: { job: SyndicationJobRecord; status: string; lastError: string | null }): void => {
  logger.error(
    {
      jobId: args.job.id,
      supplierId: args.job.supplier_id,
      network: args.job.network,
      idempotencyKey: args.job.idempotency_key,
      status: args.status,
      lastError: args.lastError
    },
    'syndication_failed'
  );
};

export const logDeadLetter = (logger: Logger, args: { job: SyndicationJobRecord; lastError: string | null }): void => {
  logger.error(
    {
      jobId: args.job.id,
      supplierId: args.job.supplier_id,
      network: args.job.network,
      idempotencyKey: args.job.idempotency_key,
      lastError: args.lastError
    },
    'syndication_dead_letter'
  );
};
