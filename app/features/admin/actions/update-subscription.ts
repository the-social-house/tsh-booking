"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import {
  subscriptionIdSchema,
  type UpdateSubscriptionInput,
  updateSubscriptionSchema,
} from "@/app/features/admin/lib/subscription.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";

/**
 * Get error message for subscription update errors
 */
function getUpdateSubscriptionErrorMessage(errorCode: string): string {
  const errorMessages = messages.admin.subscriptions.messages.error.update;
  return (
    errorMessages[errorCode as keyof typeof errorMessages] ||
    errorMessages.unknown
  );
}

/**
 * Update Stripe product metadata when subscription is updated
 */
async function updateStripeProductMetadata(
  stripeProductId: string,
  updateData: UpdateSubscriptionInput
): Promise<void> {
  // Build update object for Stripe product
  const stripeUpdate: {
    name?: string;
    metadata?: {
      max_monthly_bookings: string;
      discount_rate: string;
    };
  } = {};

  // Update name if provided
  if (updateData.subscription_name !== undefined) {
    stripeUpdate.name = updateData.subscription_name;
  }

  // Update metadata if max_monthly_bookings or discount_rate are provided
  if (
    updateData.subscription_max_monthly_bookings !== undefined ||
    updateData.subscription_discount_rate !== undefined
  ) {
    // Fetch current product to get existing metadata values
    const currentProduct = await stripe.products.retrieve(stripeProductId);
    const currentMetadata = currentProduct.metadata || {};

    stripeUpdate.metadata = {
      max_monthly_bookings:
        updateData.subscription_max_monthly_bookings?.toString() ??
        currentMetadata.max_monthly_bookings ??
        "",
      discount_rate:
        updateData.subscription_discount_rate?.toString() ??
        currentMetadata.discount_rate ??
        "0",
    };
  }

  // Only update Stripe if there are changes
  if (Object.keys(stripeUpdate).length > 0) {
    await stripe.products.update(stripeProductId, stripeUpdate);
  }
}

/**
 * Update a subscription by ID
 */
export async function updateSubscription(
  id: string,
  data: UpdateSubscriptionInput
) {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      data: null,
      error: authError,
    };
  }

  // 1. Validate ID
  const idValidation = subscriptionIdSchema.safeParse({ id });
  if (!idValidation.success) {
    return {
      data: null,
      error: createValidationError(idValidation.error),
    };
  }

  // 2. Validate update data
  const dataValidation = updateSubscriptionSchema.safeParse(data);
  if (!dataValidation.success) {
    return {
      data: null,
      error: createValidationError(dataValidation.error),
    };
  }

  // 3. Fetch existing subscription to get Stripe product ID
  const existingSubscription = await supabaseAdmin
    .from("subscriptions")
    .select("subscription_stripe_product_id")
    .eq("subscription_id", id)
    .single();

  if (existingSubscription.error) {
    const errorMessage = getUpdateSubscriptionErrorMessage(
      existingSubscription.error.code
    );
    return {
      data: null,
      error: {
        ...existingSubscription.error,
        message: errorMessage,
      },
    };
  }

  if (!existingSubscription.data) {
    const notFoundError: PostgrestError = {
      code: "PGRST116",
      message: messages.admin.subscriptions.messages.error.update.notFound,
      details: "",
      hint: "",
    } as PostgrestError;
    return { data: null, error: notFoundError };
  }

  // 4. Update Stripe product metadata if product ID exists
  const validatedData = dataValidation.data;
  const stripeProductId =
    existingSubscription.data.subscription_stripe_product_id;

  if (stripeProductId) {
    try {
      await updateStripeProductMetadata(stripeProductId, validatedData);
    } catch (stripeError) {
      // Log Stripe error but continue with database update
      // The database update should still succeed even if Stripe update fails
      console.error("Failed to update Stripe product:", stripeError);
    }
  }

  // 5. Perform database operation with validated data
  const result = await supabaseAdmin
    .from("subscriptions")
    .update(validatedData)
    .eq("subscription_id", id)
    .select()
    .single();

  // 6. Handle database errors
  if (result.error) {
    const errorMessage = getUpdateSubscriptionErrorMessage(result.error.code);
    return {
      data: null,
      error: { ...result.error, message: errorMessage },
    };
  }

  // 7. Handle not found case
  if (!result.data) {
    const notFoundError: PostgrestError = {
      code: "PGRST116",
      message: messages.admin.subscriptions.messages.error.update.notFound,
      details: "",
      hint: "",
    } as PostgrestError;

    return { data: null, error: notFoundError };
  }

  return toSupabaseMutationResponse<Tables<"subscriptions">>(result);
}
