import { pino } from 'pino';
import { pinoHttp, type Options, type ReqId } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    remove: true
  }
});

const httpLoggerOptions: Options = {
  logger,
  genReqId: (req: IncomingMessage): ReqId => {
    const existing = req.headers['x-request-id'];
    if (typeof existing === 'string' && existing.length > 0) {
      return existing;
    }
    return crypto.randomUUID();
  },
  customLogLevel: (_req: IncomingMessage, res: ServerResponse, err: Error | undefined) => {
    if (err != null || res.statusCode >= 500) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  }
};

export const httpLogger = pinoHttp(httpLoggerOptions);
