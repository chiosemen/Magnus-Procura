import { Router } from 'express';
import { z } from 'zod';

import { BadRequestError } from '../lib/errors.js';
import { authenticate } from '../services/authService.js';
import { authToken, clearAuthCookie, requireAuth, setAuthCookie } from '../middleware/auth.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const authRoutes = Router();

authRoutes.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.safeParse(req.body);
    if (!payload.success) {
      throw new BadRequestError('Invalid login payload');
    }

    const user = await authenticate(payload.data.username, payload.data.password);
    const token = await authToken.signJwt(user);
    setAuthCookie(res, token);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

authRoutes.post('/logout', requireAuth, async (req, res, next) => {
  try {
    clearAuthCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRoutes.get('/me', requireAuth, async (req, res, next) => {
  try {
    res.status(200).json({ user: req.auth });
  } catch (error) {
    next(error);
  }
});
