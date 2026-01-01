"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import {
  subscriptionIdSchema,
  type UpdateSubscriptionInput,
  updateSubscriptionSchema,
} from "@/app/features/admin/lib/subscription.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
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

  // 3. Perform database operation with validated data
  const validatedData = dataValidation.data;

  const result = await supabaseAdmin
    .from("subscriptions")
    .update(validatedData)
    .eq("subscription_id", id)
    .select()
    .single();

  // 4. Handle database errors
  if (result.error) {
    const errorMessage = getUpdateSubscriptionErrorMessage(result.error.code);
    return {
      data: null,
      error: { ...result.error, message: errorMessage },
    };
  }

  // 5. Handle not found case
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
