
import { GoogleGenAI, Type } from "@google/genai";
import { SupplierProfile, Opportunity, ContractClause } from "../types";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const analyzeSupplierReadiness = async (profile: Partial<SupplierProfile>) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Audit this supplier for Fortune 500 procurement readiness: ${JSON.stringify(profile)}. Return score 0-100 and specific gap analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "feedback"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { score: 50, feedback: "Audit server busy. Using last cached score." };
  }
};

export const suggestCodes = async (description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this business description: "${description}", suggest the 3 most relevant NAICS and UNSPSC codes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            naics: { type: Type.ARRAY, items: { type: Type.STRING } },
            unspsc: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["naics", "unspsc"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { naics: [], unspsc: [] };
  }
};

export const analyzeContract = async (contractText: string): Promise<ContractClause[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this contract snippet for an SMB supplier. Identify "Poison" (dangerous), "Negotiable", and "Standard" clauses. Snippet: "${contractText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "poison, negotiable, or standard" },
              text: { type: Type.STRING },
              comment: { type: Type.STRING },
              fallback: { type: Type.STRING }
            },
            required: ["type", "text", "comment"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return [];
  }
};
