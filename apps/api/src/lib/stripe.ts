import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export interface CheckoutOptions {
  orgId: string;
  sku: 'sprint_90' | 'year_1';
  billingInterval?: 'prepaid' | 'monthly';
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export const createCheckoutSession = async (options: CheckoutOptions): Promise<Stripe.Checkout.Session> => {
  const isMonthly = options.billingInterval === 'monthly' && options.sku === 'year_1';

  let unitAmountCents = 480000; // $4,800 year-1 prepaid default
  if (options.sku === 'sprint_90') {
    unitAmountCents = 360000; // $3,600 90-day capture sprint
  } else if (isMonthly) {
    unitAmountCents = 40000; // $400/month
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: options.customerEmail,
    client_reference_id: options.orgId,
    mode: isMonthly ? 'subscription' : 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: options.sku === 'sprint_90' ? '90-Day Capture Sprint' : 'Year-1 Enterprise Program',
            description: options.sku === 'sprint_90'
              ? '4 named intro attempts, buyer-native packet review, 3 QBRs'
              : '8 named intro attempts, full packet vault, quarterly reviews',
          },
          unit_amount: unitAmountCents,
          ...(isMonthly ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      },
    ],
    metadata: {
      org_id: options.orgId,
      sku: options.sku,
      billing_interval: options.billingInterval || 'prepaid',
    },
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
  });

  return session;
};

export const createCustomerPortalSession = async (
  stripeCustomerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> => {
  return await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
};
