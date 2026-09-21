export type Role = 'SUPPLIER' | 'BUYER' | 'ADMIN';

export interface AuthUser {
  username: string;
  role: Role;
}

export interface SupplierReadinessInput {
  legalName: string;
  industry: string;
  certifications: string[];
  esgPolicies: string[];
  diversityStatus: string[];
}

export interface ReadinessResult {
  score: number;
  feedback: string;
  gaps: string[];
}

export interface CodeSuggestion {
  naics: string[];
  unspsc: string[];
}

export interface ContractClause {
  type: 'poison' | 'negotiable' | 'standard';
  text: string;
  comment: string;
  fallback?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  category: string;
  value: string;
  deadline: string;
}
