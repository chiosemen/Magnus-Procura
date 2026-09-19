import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY || 're_dummy_key';
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'hello@magnusprocura.com';

export const resend = new Resend(resendApiKey);

export interface SendIntroEmailOptions {
  toEmail: string;
  championName: string;
  introCopy: string;
  signedPacketUrl?: string | null;
  replyTo?: string;
}

export const sendIntroEmail = async (options: SendIntroEmailOptions) => {
  let emailBody = options.introCopy;
  if (options.signedPacketUrl) {
    emailBody += `\n\n---\nReview Supplier Risk Packet (24h secure link):\n${options.signedPacketUrl}`;
  }

  return await resend.emails.send({
    from: `Magnus Procura <${resendFromEmail}>`,
    to: [options.toEmail],
    replyTo: options.replyTo,
    subject: `Intro: ${options.championName} · Magnus Procura Verified Supplier`,
    text: emailBody,
  });
};

export interface SendSlaWarningOptions {
  operatorEmail: string;
  orgName: string;
  attemptsOwed: number;
  attemptsDelivered: number;
  daysRemaining: number;
}

export const sendSlaWarningEmail = async (options: SendSlaWarningOptions) => {
  return await resend.emails.send({
    from: `Magnus Procura System <${resendFromEmail}>`,
    to: [options.operatorEmail],
    subject: `⚠️ SLA Alert: ${options.orgName} is behind delivery target`,
    text: `Operator Attention Required:\n\nMember '${options.orgName}' is currently behind schedule.\n- Attempts Delivered: ${options.attemptsDelivered} of ${options.attemptsOwed} owed\n- Days remaining in sprint/year: ${options.daysRemaining}\n\nPlease review target accounts and draft pending introductions immediately.`,
  });
};

export interface SendQbrDueOptions {
  operatorEmail: string;
  orgName: string;
  milestone: 'Day 30' | 'Day 60' | 'Day 90';
  daysSinceStart: number;
}

export const sendQbrDueEmail = async (options: SendQbrDueOptions) => {
  return await resend.emails.send({
    from: `Magnus Procura Cadence <${resendFromEmail}>`,
    to: [options.operatorEmail],
    subject: `📊 QBR Due: ${options.orgName} has reached ${options.milestone}`,
    text: `Operating Cadence Notice:\n\nMember '${options.orgName}' has reached ${options.daysSinceStart} days since sprint start (${options.milestone} Milestone).\n\nAction Required:\n1. Audit active funnel vs cohort benchmarks.\n2. Review 5 primary accounts (kill unresponsive, promote bench).\n3. Schedule quarterly review with client decision-maker.\n\nAccess operator console: https://app.magnusprocura.com/ops`,
  });
};

export interface SendCopyApprovalReminderOptions {
  memberEmail: string;
  orgName: string;
  championName: string;
  targetAccount: string;
  daysPending: number;
}

export const sendCopyApprovalReminderEmail = async (options: SendCopyApprovalReminderOptions) => {
  return await resend.emails.send({
    from: `Magnus Procura Operations <${resendFromEmail}>`,
    to: [options.memberEmail],
    subject: `Action Required: Intro copy ready for approval (${options.targetAccount})`,
    text: `Hello,\n\nYour assigned operator has drafted bespoke introduction copy for champion ${options.championName} at ${options.targetAccount}.\n\nThis draft has been pending your approval for ${options.daysPending} days (Kickoff Cadence SLA: 5 business days).\n\nPlease log in to review, edit, or approve the copy to authorize dispatch:\nhttps://app.magnusprocura.com/intros\n\nNote: Unresponsive accounts (>14 days silence) automatically pause the SLA delivery clock.`,
  });
};
