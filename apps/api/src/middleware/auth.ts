import type { NextFunction, Request, Response } from 'express';
import { jwtVerify, SignJWT } from 'jose';

import { env } from '../config/env.js';
import { UnauthorizedError } from '../lib/errors.js';
import type { AuthUser, Role } from '../types/auth.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);

const signJwt = async (user: AuthUser): Promise<string> => {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.username)
    .setIssuedAt()
    .setExpirationTime(`${env.SESSION_TTL_SECONDS}s`)
    .sign(secret);
};

const verifyJwt = async (token: string): Promise<AuthUser> => {
  const verification = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  const role = verification.payload['role'];
  const subject = verification.payload.sub;

  if (typeof subject !== 'string') {
    throw new UnauthorizedError();
  }

  if (role !== 'SUPPLIER' && role !== 'BUYER' && role !== 'ADMIN') {
    throw new UnauthorizedError();
  }

  return {
    username: subject,
    role
  };
};

export const authToken = {
  signJwt,
  verifyJwt
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies[env.SESSION_COOKIE_NAME];
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedError();
    }

    const user = await verifyJwt(token);
    req.auth = user;
    next();
  } catch {
    next(new UnauthorizedError());
  }
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.AUTH_COOKIE_SECURE,
    sameSite: 'strict',
    maxAge: env.SESSION_TTL_SECONDS * 1000,
    path: '/'
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: env.AUTH_COOKIE_SECURE,
    sameSite: 'strict',
    path: '/'
  });
};

export const hasRole = (userRole: Role, allowed: readonly Role[]): boolean => {
  return allowed.includes(userRole);
};
