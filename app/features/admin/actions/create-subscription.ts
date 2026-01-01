"use server";

import {
  type CreateSubscriptionInput,
  createSubscriptionSchema,
} from "@/app/features/admin/lib/subscription.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
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

  const result = await supabaseAdmin
    .from("subscriptions")
    .insert(validatedData as TablesInsert<"subscriptions">)
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
