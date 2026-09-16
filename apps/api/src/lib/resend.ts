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
