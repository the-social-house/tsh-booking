import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Disable body parsing - we need the raw body for signature verification
export const runtime = "nodejs";

/**
 * Verifies webhook signature and returns the event
 */
function verifyWebhookSignature(
  body: string,
  signature: string | null,
  webhookSecret: string
): { event: Stripe.Event } | { error: string; status: number } {
  if (!signature) {
    console.error("[webhook] Missing stripe-signature header");
    return { error: "Missing signature", status: 400 };
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
    return { event };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Signature verification failed:", errorMessage);
    return {
      error: `Webhook signature verification failed: ${errorMessage}`,
      status: 400,
    };
  }
}

/**
 * Retrieves customer and validates metadata
 */
async function getCustomerWithMetadata(
  customerId: string
): Promise<
  | { customer: Stripe.Customer; userId: string }
  | { error: string; status: number }
> {
  try {
    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted || typeof customer === "string") {
      console.error("[webhook] Invalid customer:", customerId);
      return { error: "Invalid customer", status: 400 };
    }

    const userId = customer.metadata?.user_id;

    if (!userId) {
      console.error("[webhook] Customer missing user_id metadata:", customerId);
      return { error: "Customer missing user_id metadata", status: 400 };
    }

    return { customer, userId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[webhook] Error retrieving customer:", errorMessage);
    return {
      error: `Customer retrieval error: ${errorMessage}`,
      status: 500,
    };
  }
}

/**
 * Updates user status from pending to active
 */
async function activateUser(
  userId: string,
  paymentIntentId: string
): Promise<
  { success: true; userId: string } | { error: string; status: number }
> {
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from("users")
    .update({ user_status: "active" })
    .eq("user_id", userId)
    .eq("user_status", "pending") // Only update if still pending (idempotency)
    .select()
    .single();

  if (updateError) {
    console.error(
      "[webhook] Failed to update user status:",
      updateError,
      "userId:",
      userId
    );
    return { error: "Failed to update user status", status: 500 };
  }

  if (!updatedUser) {
    // User not found or already active - log but don't fail
    console.warn(
      "[webhook] User not found or already active:",
      userId,
      "payment_intent:",
      paymentIntentId
    );
    return { error: "already_processed", status: 200 };
  }

  console.log(
    "[webhook] User activated successfully:",
    userId,
    "payment_intent:",
    paymentIntentId
  );

  return { success: true, userId };
}

/**
 * Handles payment_intent.succeeded events
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<NextResponse> {
  const customerId = paymentIntent.customer;

  if (!customerId || typeof customerId !== "string") {
    console.error(
      "[webhook] Payment intent missing customer ID:",
      paymentIntent.id
    );
    return NextResponse.json(
      { error: "Payment intent missing customer" },
      { status: 400 }
    );
  }

  const customerResult = await getCustomerWithMetadata(customerId);
  if ("error" in customerResult) {
    return NextResponse.json(
      { error: customerResult.error },
      { status: customerResult.status }
    );
  }

  const { userId } = customerResult;

  const activationResult = await activateUser(userId, paymentIntent.id);
  if ("error" in activationResult) {
    if (activationResult.status === 200) {
      // Already processed - return success
      return NextResponse.json({
        received: true,
        status: "already_processed",
      });
    }
    return NextResponse.json(
      { error: activationResult.error },
      { status: activationResult.status }
    );
  }

  return NextResponse.json({
    received: true,
    status: "user_activated",
    userId: activationResult.userId,
  });
}

/**
 * Stripe webhook handler
 *
 * Handles payment_intent.succeeded events to activate user accounts
 * after successful payment during signup.
 *
 * Flow:
 * 1. Verify webhook signature (security)
 * 2. Parse event payload
 * 3. Handle payment_intent.succeeded events
 * 4. Extract user_id from customer metadata
 * 5. Update user_status from 'pending' to 'active'
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      "[webhook] Missing STRIPE_WEBHOOK_SECRET environment variable"
    );
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  const verificationResult = verifyWebhookSignature(
    body,
    signature,
    webhookSecret
  );

  if ("error" in verificationResult) {
    return NextResponse.json(
      { error: verificationResult.error },
      { status: verificationResult.status }
    );
  }

  const { event } = verificationResult;

  // Handle payment_intent.succeeded events
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    return await handlePaymentIntentSucceeded(paymentIntent);
  }

  // For other event types, just acknowledge receipt
  console.log("[webhook] Unhandled event type:", event.type);
  return NextResponse.json({ received: true, status: "unhandled_event" });
}
