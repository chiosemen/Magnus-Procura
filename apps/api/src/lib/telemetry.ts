import { env } from '../config/env.js';
import { logger } from './logger.js';

interface CaptureErrorArgs {
  requestId: string;
  code: string;
  message: string;
  stack?: string;
}

export const captureError = (args: CaptureErrorArgs): void => {
  const payload = {
    telemetryEnabled: env.TELEMETRY_DSN != null,
    dsn: env.TELEMETRY_DSN,
    requestId: args.requestId,
    code: args.code,
    message: args.message,
    stack: args.stack
  };

  logger.error(payload, 'error-captured');
};
