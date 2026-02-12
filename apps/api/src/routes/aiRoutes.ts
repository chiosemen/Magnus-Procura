import { Router } from 'express';
import { z } from 'zod';

import { BadRequestError } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { analyzeContract, analyzeSupplierReadiness, suggestCodes } from '../services/geminiService.js';

const readinessSchema = z.object({
  legalName: z.string().min(1),
  industry: z.string().min(1),
  certifications: z.array(z.string()),
  esgPolicies: z.array(z.string()),
  diversityStatus: z.array(z.string())
});

const descriptionSchema = z.object({
  description: z.string().min(10)
});

const contractSchema = z.object({
  contractText: z.string().min(50)
});

export const aiRoutes = Router();

aiRoutes.post('/supplier/readiness', requireAuth, requireRole(['SUPPLIER', 'ADMIN']), async (req, res, next) => {
  try {
    const payload = readinessSchema.safeParse(req.body);
    if (!payload.success) {
      throw new BadRequestError('Invalid readiness request payload');
    }

    const result = await analyzeSupplierReadiness(payload.data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

aiRoutes.post('/supplier/codes', requireAuth, requireRole(['SUPPLIER', 'ADMIN']), async (req, res, next) => {
  try {
    const payload = descriptionSchema.safeParse(req.body);
    if (!payload.success) {
      throw new BadRequestError('Invalid code suggestion payload');
    }

    const result = await suggestCodes(payload.data.description);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

aiRoutes.post('/contracts/analyze', requireAuth, requireRole(['SUPPLIER', 'BUYER', 'ADMIN']), async (req, res, next) => {
  try {
    const payload = contractSchema.safeParse(req.body);
    if (!payload.success) {
      throw new BadRequestError('Invalid contract analysis payload');
    }

    const result = await analyzeContract(payload.data.contractText);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

aiRoutes.get('/buyer/opportunities', requireAuth, requireRole(['BUYER', 'ADMIN']), async (_req, res, next) => {
  try {
    res.status(200).json({
      opportunities: [
        {
          id: 'enterprise-cloud-migration',
          title: 'Enterprise Cloud Migration',
          category: 'IT Services',
          value: '$450,000',
          deadline: '2026-04-30'
        }
      ]
    });
  } catch (error) {
    next(error);
  }
});
