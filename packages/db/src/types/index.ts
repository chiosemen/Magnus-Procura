import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from '../schema';

export type Profile = InferSelectModel<typeof schema.profiles>;
export type NewProfile = InferInsertModel<typeof schema.profiles>;

export type Organization = InferSelectModel<typeof schema.organizations>;
export type NewOrganization = InferInsertModel<typeof schema.organizations>;

export type OrgMember = InferSelectModel<typeof schema.orgMembers>;
export type NewOrgMember = InferInsertModel<typeof schema.orgMembers>;

export type Program = InferSelectModel<typeof schema.programs>;
export type NewProgram = InferInsertModel<typeof schema.programs>;

export type Packet = InferSelectModel<typeof schema.packets>;
export type NewPacket = InferInsertModel<typeof schema.packets>;

export type Artifact = InferSelectModel<typeof schema.artifacts>;
export type NewArtifact = InferInsertModel<typeof schema.artifacts>;

export type AccountTarget = InferSelectModel<typeof schema.accountTargets>;
export type NewAccountTarget = InferInsertModel<typeof schema.accountTargets>;

export type Person = InferSelectModel<typeof schema.people>;
export type NewPerson = InferInsertModel<typeof schema.people>;

export type Intro = InferSelectModel<typeof schema.intros>;
export type NewIntro = InferInsertModel<typeof schema.intros>;

export type StageTransition = InferSelectModel<typeof schema.stageTransitions>;
export type NewStageTransition = InferInsertModel<typeof schema.stageTransitions>;

export type Opportunity = InferSelectModel<typeof schema.opportunities>;
export type NewOpportunity = InferInsertModel<typeof schema.opportunities>;

export type Attestation = InferSelectModel<typeof schema.attestations>;
export type NewAttestation = InferInsertModel<typeof schema.attestations>;

export type Partner = InferSelectModel<typeof schema.partners>;
export type NewPartner = InferInsertModel<typeof schema.partners>;

export type Referral = InferSelectModel<typeof schema.referrals>;
export type NewReferral = InferInsertModel<typeof schema.referrals>;

export type Bounty = InferSelectModel<typeof schema.bounties>;
export type NewBounty = InferInsertModel<typeof schema.bounties>;

export type Invoice = InferSelectModel<typeof schema.invoices>;
export type NewInvoice = InferInsertModel<typeof schema.invoices>;

export type OperatorAssignment = InferSelectModel<typeof schema.operatorAssignments>;
export type NewOperatorAssignment = InferInsertModel<typeof schema.operatorAssignments>;

export type OperatorHour = InferSelectModel<typeof schema.operatorHours>;
export type NewOperatorHour = InferInsertModel<typeof schema.operatorHours>;

export type Cohort = InferSelectModel<typeof schema.cohorts>;
export type NewCohort = InferInsertModel<typeof schema.cohorts>;

export type AuditLog = InferSelectModel<typeof schema.auditLog>;
export type NewAuditLog = InferInsertModel<typeof schema.auditLog>;
