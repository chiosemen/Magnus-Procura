
import { Opportunity, SupplierProfile, Document } from './types';

export const MOCK_DOCUMENTS: Document[] = [
  { id: 'doc-1', type: 'Insurance', name: 'General Liability COI', status: 'valid', expiryDate: '2025-01-15', issuer: 'Liberty Mutual' },
  { id: 'doc-2', type: 'Cyber', name: 'Cyber Liability Policy', status: 'expiring', expiryDate: '2024-06-30', issuer: 'Chubb' },
  { id: 'doc-3', type: 'Audit', name: 'SOC2 Type II Report', status: 'valid', expiryDate: '2024-12-10', issuer: 'Deloitte' },
  { id: 'doc-4', type: 'Diversity', name: 'WBE Certification', status: 'valid', expiryDate: '2026-03-20', issuer: 'WBENC' }
];

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Enterprise Cloud Migration',
    buyerName: 'Global Tech Corp',
    value: '$450k',
    category: 'IT Services',
    deadline: '2024-08-15',
    type: 'RFP',
    description: 'Migration of 400+ servers to Azure Cloud infrastructure.',
    requirements: ['ISO 27001', 'SOC2', 'Cyber Liability'],
    matchScore: 94,
    urgencyDays: 12
  },
  {
    id: 'opp-2',
    title: 'Eco-Friendly Office Supplies',
    buyerName: 'Standard Chartered',
    value: '$120k Annually',
    category: 'Facilities',
    deadline: '2024-07-01',
    type: 'RFQ',
    description: 'Bulk supply of sustainable paper and ink products.',
    requirements: ['FSC Certified', 'General Liability'],
    matchScore: 82,
    urgencyDays: 1
  },
  {
    id: 'opp-3',
    title: 'New Hospital Wing HVAC',
    buyerName: 'St. Mary Medical',
    value: '$2.1M',
    category: 'Construction',
    deadline: '2024-09-10',
    type: 'RFP',
    description: 'Design-build HVAC system for new emergency wing.',
    requirements: ['Bid Bond', 'Prevailing Wage Compliance', 'OSHA 30'],
    matchScore: 78,
    urgencyDays: 45
  }
];

export const INITIAL_SUPPLIER: SupplierProfile = {
  id: 'sup-101',
  name: 'Nova Solutions Inc.',
  legalName: 'Nova Solutions Global LLC',
  duns: '12-345-6789',
  taxId: 'XX-XXXX123',
  industry: 'IT Services',
  revenue: '$5M - $10M',
  employeeCount: 45,
  certifications: ['ISO 9001', 'Cyber Essentials'],
  description: 'Specialists in cloud migration and custom software development.',
  readinessScore: 72,
  readinessFeedback: 'Update your Cyber Liability insurance to reach 90% readiness.',
  naicsCodes: ['541511', '541512'],
  unspscCodes: ['81111508', '43230000'],
  diversityStatus: ['WOSB', 'Small Business'],
  esgPolicies: ['Modern Slavery Statement', 'Carbon Neutrality Plan'],
  networks: [
    { name: 'Ariba', status: 'active', vendorId: 'V-9921', lastSync: '2024-05-10' },
    { name: 'Coupa', status: 'pending', lastSync: '2024-05-12' },
    { name: 'Jaggaer', status: 'none' }
  ],
  vault: MOCK_DOCUMENTS
};
