"use server";

import {
  type CreateSubscriptionInput,
  createSubscriptionSchema,
} from "@/app/features/admin/lib/subscription.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables, TablesInsert } from "@/supabase/types/database";

function getFieldForDatabaseError(errorCode: string): string | null {
  const fieldMap: Record<string, string> = {
    // 23505 = unique violation - subscription_name is the only unique field
    "23505": "subscription_name",
  };
  return fieldMap[errorCode] ?? null;
}

/**
 * Get error message for subscription create errors
 */
function getCreateSubscriptionErrorMessage(errorCode: string): string {
  const errorMessages = messages.admin.subscriptions.messages.error.create;
  return (
    errorMessages[errorCode as keyof typeof errorMessages] ||
    errorMessages.unknown
  );
}

/**
 * Create a new subscription
 * Creates both a Stripe product/price and a database record
 */
export async function createSubscription(data: CreateSubscriptionInput) {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      data: null,
      error: authError,
    };
  }

  const validationResult = createSubscriptionSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  const validatedData = validationResult.data;

  // Convert DKK to øre (1 DKK = 100 øre) for Stripe
  const amountInOre = Math.round(
    validatedData.subscription_monthly_price * 100
  );

  // Create Stripe product with metadata
  let stripeProduct: Awaited<ReturnType<typeof stripe.products.create>>;
  try {
    stripeProduct = await stripe.products.create({
      name: validatedData.subscription_name,
      metadata: {
        max_monthly_bookings:
          validatedData.subscription_max_monthly_bookings?.toString() ?? "",
        discount_rate: validatedData.subscription_discount_rate.toString(),
      },
    });
  } catch (stripeError) {
    return {
      data: null,
      error: {
        code: "STRIPE_ERROR",
        message: "Failed to create Stripe product",
        details:
          stripeError instanceof Error
            ? stripeError.message
            : String(stripeError),
        hint: "",
        name: "StripeError",
      },
    };
  }

  // Create Stripe price with monthly recurring billing
  let stripePrice: Awaited<ReturnType<typeof stripe.prices.create>>;
  try {
    stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: amountInOre,
      currency: "dkk",
      recurring: {
        interval: "month",
      },
    });
  } catch (stripeError) {
    // If price creation fails, try to clean up the product
    try {
      await stripe.products.update(stripeProduct.id, { active: false });
    } catch {
      // Ignore cleanup errors
    }

    return {
      data: null,
      error: {
        code: "STRIPE_ERROR",
        message: "Failed to create Stripe price",
        details:
          stripeError instanceof Error
            ? stripeError.message
            : String(stripeError),
        hint: "",
        name: "StripeError",
      },
    };
  }

  // Create database record with Stripe IDs
  const result = await supabaseAdmin
    .from("subscriptions")
    .insert({
      ...validatedData,
      subscription_stripe_product_id: stripeProduct.id,
      subscription_stripe_price_id: stripePrice.id,
    } as TablesInsert<"subscriptions">)
    .select()
    .single();

  if (result.error) {
    const errorMessage = getCreateSubscriptionErrorMessage(result.error.code);
    const errorField = getFieldForDatabaseError(result.error.code);

    const details = errorField
      ? JSON.stringify([{ path: [errorField], message: errorMessage }])
      : result.error.details;

    return {
      data: null,
      error: { ...result.error, message: errorMessage, details },
    };
  }

  return toSupabaseMutationResponse<Tables<"subscriptions">>(result);
}
