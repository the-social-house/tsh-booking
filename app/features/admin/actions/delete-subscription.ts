"use server";

import { subscriptionIdSchema } from "@/app/features/admin/lib/subscription.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResult } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

/**
 * Archive a Stripe product
 * Note: Stripe doesn't allow deleting products with prices, so we archive them instead
 */
async function archiveStripeProduct(productId: string): Promise<void> {
  await stripe.products.update(productId, { active: false });
}

/**
 * Fetch subscription with Stripe IDs
 */
async function fetchSubscriptionWithStripeIds(id: string) {
  return await supabaseAdmin
    .from("subscriptions")
    .select("subscription_stripe_product_id, subscription_stripe_price_id")
    .eq("subscription_id", id)
    .single();
}

/**
 * Delete subscription from database
 */
async function deleteSubscriptionFromDb(id: string) {
  return await supabaseAdmin
    .from("subscriptions")
    .delete()
    .eq("subscription_id", id);
}

/**
 * Get formatted error message for database deletion errors
 */
function getDbDeleteErrorMessage(errorCode: string): string {
  const errorMessages = messages.admin.subscriptions.messages.error.delete;
  return (
    errorMessages[errorCode as keyof typeof errorMessages] ||
    errorMessages.unknown
  );
}

/**
 * Delete a subscription by ID
 */
export async function deleteSubscription(id: string) {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return { success: false, error: authError };
  }

  const validationResult = subscriptionIdSchema.safeParse({ id });
  if (!validationResult.success) {
    return {
      success: false,
      error: createValidationError(validationResult.error),
    };
  }

  // Fetch subscription to get Stripe IDs before deletion
  const { data: subscription, error: fetchError } =
    await fetchSubscriptionWithStripeIds(id);

  if (fetchError || !subscription) {
    return {
      success: false,
      error: {
        code: "PGRST116",
        message: messages.admin.subscriptions.messages.error.delete.notFound,
        details: fetchError?.details || "",
        hint: fetchError?.hint || "",
        name: "PostgrestError",
      },
    };
  }

  // Archive from Stripe if product ID exists
  if (subscription.subscription_stripe_product_id) {
    try {
      await archiveStripeProduct(subscription.subscription_stripe_product_id);
    } catch (stripeError) {
      return {
        success: false,
        error: {
          code: "STRIPE_ARCHIVE_ERROR",
          message: "Failed to archive Stripe product",
          details:
            stripeError instanceof Error
              ? stripeError.message
              : String(stripeError),
          hint: "",
          name: "StripeError",
        },
      };
    }
  }

  // Delete from database
  const result = await deleteSubscriptionFromDb(id);

  if (result.error) {
    return {
      success: false,
      error: {
        ...result.error,
        message: getDbDeleteErrorMessage(result.error.code),
      },
    };
  }

  return toSupabaseMutationResult(result);
}
