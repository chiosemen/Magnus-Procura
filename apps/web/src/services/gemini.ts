import type {
  CodeSuggestion,
  ContractClause,
  Opportunity,
  ReadinessResult,
  SupplierReadinessInput
} from '@shared-types/index';

import { requestJson } from './api';

export const analyzeSupplierReadiness = async (
  profile: SupplierReadinessInput
): Promise<ReadinessResult> => {
  return requestJson<ReadinessResult>('/api/supplier/readiness', {
    method: 'POST',
    body: JSON.stringify(profile)
  });
};

export const suggestCodes = async (description: string): Promise<CodeSuggestion> => {
  return requestJson<CodeSuggestion>('/api/supplier/codes', {
    method: 'POST',
    body: JSON.stringify({ description })
  });
};

export const analyzeContract = async (contractText: string): Promise<ContractClause[]> => {
  return requestJson<ContractClause[]>('/api/contracts/analyze', {
    method: 'POST',
    body: JSON.stringify({ contractText })
  });
};

export const fetchBuyerOpportunities = async (): Promise<Opportunity[]> => {
  const response = await requestJson<{ opportunities: Opportunity[] }>('/api/buyer/opportunities', {
    method: 'GET'
  });

  return response.opportunities;
};
