import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import type { Role } from '../types/auth.js';
import { hasRole } from './auth.js';

export const requireRole = (allowed: readonly Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.auth == null) {
      next(new UnauthorizedError());
      return;
    }

    if (!hasRole(req.auth.role, allowed)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
};
