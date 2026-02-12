import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { HttpError } from './lib/errors.js';
import { httpLogger } from './lib/logger.js';
import { captureError } from './lib/telemetry.js';
import { authRoutes } from './routes/authRoutes.js';
import { aiRoutes } from './routes/aiRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { scoringRoutes } from './routes/scoringRoutes.js';
import { agentRoutes } from './routes/agentRoutes.js';

const buildCsp = () => {
  return {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  } as const;
};

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');

  app.use(httpLogger);
  app.use(
    helmet({
      contentSecurityPolicy: buildCsp(),
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'no-referrer' }
    })
  );

  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true
    })
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());

  app.use(healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api', aiRoutes);
  app.use('/api/scoring', scoringRoutes);
  app.use('/api/agent', agentRoutes);

  app.use((req, _res, next) => {
    next(new HttpError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.path}`));
  });

  app.use((error: unknown, req: express.Request, res: express.Response) => {
    const requestId = req.id != null ? String(req.id) : 'unknown';

    if (error instanceof HttpError) {
      if (error.statusCode >= 500) {
        captureError({
          requestId,
          code: error.code,
          message: error.message,
          ...(error.stack ? { stack: error.stack } : {})
        });
      }

      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          requestId
        }
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    const stack = error instanceof Error ? error.stack : undefined;

    captureError({
      requestId,
      code: 'INTERNAL_SERVER_ERROR',
      message,
      ...(stack ? { stack } : {})
    });

    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        requestId
      }
    });
  });

  return app;
};
