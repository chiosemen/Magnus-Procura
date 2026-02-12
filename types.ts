
export enum UserRole {
  SUPPLIER = 'SUPPLIER',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN'
}

export type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'missing';

export interface Document {
  id: string;
  type: string;
  name: string;
  status: DocumentStatus;
  expiryDate?: string;
  issuer?: string;
  fileUrl?: string;
}

export interface NetworkStatus {
  name: 'Ariba' | 'Coupa' | 'Jaggaer' | 'Fairmarkit' | 'ISNetworld';
  status: 'active' | 'pending' | 'none' | 'error';
  vendorId?: string;
  lastSync?: string;
}

export interface SupplierProfile {
  id: string;
  name: string;
  legalName: string;
  duns: string;
  taxId: string;
  industry: string;
  revenue: string;
  employeeCount: number;
  certifications: string[];
  description: string;
  readinessScore: number;
  readinessFeedback: string;
  naicsCodes: string[];
  unspscCodes: string[];
  diversityStatus: string[];
  esgPolicies: string[];
  networks: NetworkStatus[];
  vault: Document[];
}

export interface Opportunity {
  id: string;
  title: string;
  buyerName: string;
  value: string;
  category: string;
  deadline: string;
  description: string;
  requirements: string[];
  matchScore?: number;
  type: 'RFP' | 'RFQ' | 'IFB';
  urgencyDays?: number;
}

export interface ContractClause {
  id: string;
  type: 'poison' | 'negotiable' | 'standard';
  text: string;
  fallback?: string;
  comment: string;
}

export type ClauseAction = 'accepted' | 'flagged' | 'replaced' | null;

export interface RedlineHistoryItem {
  id: string;
  timestamp: string;
  contractSnippet: string;
  clauses: ContractClause[];
  decisions: Record<number, ClauseAction>;
}

export type VerticalType = 'Construction' | 'Healthcare' | 'Tech' | 'General';

export interface MobileAppState {
  onboardingComplete: boolean;
  pursuedOpportunityIds: string[];
  vertical: VerticalType;
  lastNotification?: string;
}
