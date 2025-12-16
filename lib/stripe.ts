import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error(
    "Missing Stripe environment variable. Please set STRIPE_SECRET_KEY"
  );
}

/**
 * Stripe client instance for server-side operations
 * Use this for creating payment intents, handling webhooks, etc.
 */
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});
