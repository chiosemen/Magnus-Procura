import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

import { env } from '../config/env.js';
import { UpstreamServiceError } from '../lib/errors.js';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const readinessSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string().min(1),
  gaps: z.array(z.string()).default([])
});

const codeSchema = z.object({
  naics: z.array(z.string()),
  unspsc: z.array(z.string())
});

const contractSchema = z.array(
  z.object({
    type: z.enum(['poison', 'negotiable', 'standard']),
    text: z.string(),
    comment: z.string(),
    fallback: z.string().optional()
  })
);

export interface SupplierProfileInput {
  legalName: string;
  industry: string;
  certifications: string[];
  esgPolicies: string[];
  diversityStatus: string[];
}

const parseResponseText = (text: string | undefined): unknown => {
  if (text == null || text.length === 0) {
    throw new UpstreamServiceError('Upstream response was empty');
  }

  return JSON.parse(text);
};

export const analyzeSupplierReadiness = async (profile: SupplierProfileInput): Promise<z.infer<typeof readinessSchema>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Audit this supplier for enterprise procurement readiness: ${JSON.stringify(profile)}. Return score 0-100, feedback, and gaps.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['score', 'feedback', 'gaps']
        }
      }
    });

    const parsed = parseResponseText(response.text);
    return readinessSchema.parse(parsed);
  } catch {
    throw new UpstreamServiceError('Readiness analysis failed');
  }
};

export const suggestCodes = async (description: string): Promise<z.infer<typeof codeSchema>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on this business description: "${description}", suggest the 3 most relevant NAICS and UNSPSC codes.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            naics: { type: Type.ARRAY, items: { type: Type.STRING } },
            unspsc: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['naics', 'unspsc']
        }
      }
    });

    const parsed = parseResponseText(response.text);
    return codeSchema.parse(parsed);
  } catch {
    throw new UpstreamServiceError('Code suggestion failed');
  }
};

export const analyzeContract = async (contractText: string): Promise<z.infer<typeof contractSchema>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this contract snippet for an SMB supplier. Identify poison, negotiable, and standard clauses. Snippet: "${contractText}".`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              text: { type: Type.STRING },
              comment: { type: Type.STRING },
              fallback: { type: Type.STRING }
            },
            required: ['type', 'text', 'comment']
          }
        }
      }
    });

    const parsed = parseResponseText(response.text);
    return contractSchema.parse(parsed);
  } catch {
    throw new UpstreamServiceError('Contract analysis failed');
  }
};
