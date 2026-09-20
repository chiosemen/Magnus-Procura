import { 
  pgTable, 
  uuid, 
  text, 
  boolean, 
  integer, 
  timestamp, 
  date, 
  jsonb, 
  pgEnum, 
  primaryKey 
} from 'drizzle-orm/pg-core';

// Enums
export const orgTypeEnum = pgEnum('org_type', ['member', 'partner', 'internal']);
export const orgStatusEnum = pgEnum('org_status', ['active', 'unresponsive', 'paused', 'exited']);
export const memberRoleEnum = pgEnum('member_role', ['owner', 'collaborator', 'operator', 'admin', 'referrer']);
export const programSkuEnum = pgEnum('program_sku', ['sprint_90', 'year_1', 'year_2_maintenance']);
export const programStatusEnum = pgEnum('program_status', ['pending', 'active', 'completed', 'cancelled', 'paused']);
export const packetStatusEnum = pgEnum('packet_status', ['ready', 'blocked']);
export const artifactKindEnum = pgEnum('artifact_kind', [
  'capability_statement', 
  'one_liner', 
  'naics_list', 
  'coi', 
  'financials', 
  'past_performance', 
  'portal_list', 
  'logo', 
  'other'
]);
export const artifactStatusEnum = pgEnum('artifact_status', ['have', 'gap', 'waived']);
export const targetTierEnum = pgEnum('target_tier', ['primary', 'bench']);
export const targetStatusEnum = pgEnum('target_status', [
  'research', 
  'approached', 
  'accepted', 
  'declined', 
  'met', 
  'qualified', 
  'opp', 
  'dead',
  'exhausted'
]);
export const introResultEnum = pgEnum('intro_result', [
  'sent', 
  'accepted', 
  'declined', 
  'no_response', 
  'met', 
  'no_show'
]);
export const partnerStatusEnum = pgEnum('partner_status', ['active', 'paused', 'terminated']);
export const invoiceKindEnum = pgEnum('invoice_kind', ['program', 'success', 'bounty']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'open', 'paid', 'uncollectible', 'void']);
export const attestationStatusEnum = pgEnum('attestation_status', ['submitted', 'accepted', 'rejected']);

// 6.1 Core
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  isInternal: boolean('is_internal').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: orgTypeEnum('type').notNull(),
  fitScore: integer('fit_score').default(0).notNull(),
  status: orgStatusEnum('status').default('active').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orgMembers = pgTable('org_members', {
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  role: memberRoleEnum('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.orgId, t.profileId] }),
]);

export const programs = pgTable('programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  sku: programSkuEnum('sku').notNull(),
  startsOn: timestamp('starts_on', { withTimezone: true }).notNull(),
  endsOn: timestamp('ends_on', { withTimezone: true }).notNull(),
  attemptsOwed: integer('attempts_owed').default(8).notNull(),
  refundUntil: timestamp('refund_until', { withTimezone: true }).notNull(),
  status: programStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fitReviews = pgTable('fit_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  hardFail: boolean('hard_fail').default(false).notNull(),
  notes: text('notes'),
  reviewerId: uuid('reviewer_id').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6.2 The File
export const packets = pgTable('packets', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull().unique(),
  status: packetStatusEnum('status').default('blocked').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const artifacts = pgTable('artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  packetId: uuid('packet_id').references(() => packets.id, { onDelete: 'cascade' }).notNull(),
  kind: artifactKindEnum('kind').notNull(),
  storagePath: text('storage_path').notNull(),
  status: artifactStatusEnum('status').default('gap').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accountTargets = pgTable('account_targets', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  tier: targetTierEnum('tier').default('primary').notNull(),
  status: targetStatusEnum('status').default('research').notNull(),
  whyUs: text('why_us'),
  knownDesk: text('known_desk'),
  doNotHit: boolean('do_not_hit').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const people = pgTable('people', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountTargetId: uuid('account_target_id').references(() => accountTargets.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  email: text('email'),
  doNotContactUntil: timestamp('do_not_contact_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6.3 Factory — intros and stages
export const intros = pgTable('intros', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  accountTargetId: uuid('account_target_id').references(() => accountTargets.id, { onDelete: 'cascade' }).notNull(),
  personId: uuid('person_id').references(() => people.id, { onDelete: 'cascade' }).notNull(),
  channel: text('channel').default('email').notNull(),
  copy: text('copy').notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  result: introResultEnum('result'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stageTransitions = pgTable('stage_transitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  fromStage: text('from_stage').notNull(),
  toStage: text('to_stage').notNull(),
  sourceId: uuid('source_id'),
  at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
});

export const opportunities = pgTable('opportunities', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  accountTargetId: uuid('account_target_id').references(() => accountTargets.id, { onDelete: 'cascade' }).notNull(),
  kind: text('kind').notNull(),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const attestations = pgTable('attestations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  amountCents: integer('amount_cents').notNull(),
  buyer: text('buyer').notNull(),
  evidencePath: text('evidence_path').notNull(),
  status: attestationStatusEnum('status').default('submitted').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  kind: text('kind').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6.4 Partners, money, ops
export const partners = pgTable('partners', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  bountyCents: integer('bounty_cents').default(25000).notNull(), // $250 default
  termEnds: timestamp('term_ends', { withTimezone: true }),
  status: partnerStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const referrals = pgTable('referrals', {
  id: uuid('id').defaultRandom().primaryKey(),
  partnerId: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }).notNull(),
  payload: jsonb('payload').notNull(),
  fitStatus: text('fit_status').default('pending').notNull(),
  resultingOrgId: uuid('resulting_org_id').references(() => organizations.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bounties = pgTable('bounties', {
  id: uuid('id').defaultRandom().primaryKey(),
  referralId: uuid('referral_id').references(() => referrals.id, { onDelete: 'cascade' }).notNull(),
  dueOn: date('due_on').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  clawedAt: timestamp('clawed_at', { withTimezone: true }),
  amountCents: integer('amount_cents').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  kind: invoiceKindEnum('kind').notNull(),
  stripeId: text('stripe_id'),
  amountCents: integer('amount_cents').notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  status: invoiceStatusEnum('status').default('open').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const operatorAssignments = pgTable('operator_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const operatorHours = pgTable('operator_hours', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  minutes: integer('minutes').notNull(),
  day: date('day').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cohorts = pgTable('cohorts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  startedOn: date('started_on').notNull(),
  isPublishable: boolean('is_publishable').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cohortMembers = pgTable('cohort_members', {
  cohortId: uuid('cohort_id').references(() => cohorts.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.cohortId, t.orgId] }),
]);

export const scoreSnapshots = pgTable('score_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  cohortId: uuid('cohort_id').references(() => cohorts.id, { onDelete: 'cascade' }).notNull(),
  json: jsonb('json').notNull(),
  takenAt: timestamp('taken_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const doNotServe = pgTable('do_not_serve', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityName: text('entity_name').notNull(),
  domain: text('domain'),
  reason: text('reason').notNull(),
  notes: text('notes'),
  flaggedBy: uuid('flagged_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

