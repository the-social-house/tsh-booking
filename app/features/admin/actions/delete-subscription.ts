"use server";

import { subscriptionIdSchema } from "@/app/features/admin/lib/subscription.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResult } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

/**
 * Get error message for subscription delete errors
 */
function getDeleteSubscriptionErrorMessage(errorCode: string): string {
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
    return {
      success: false,
      error: authError,
    };
  }

  const validationResult = subscriptionIdSchema.safeParse({ id });
  if (!validationResult.success) {
    return {
      success: false,
      error: createValidationError(validationResult.error),
    };
  }

  const result = await supabaseAdmin
    .from("subscriptions")
    .delete()
    .eq("subscription_id", id);

  if (result.error) {
    const errorMessage = getDeleteSubscriptionErrorMessage(result.error.code);
    return {
      success: false,
      error: { ...result.error, message: errorMessage },
    };
  }

  return toSupabaseMutationResult(result);
}
