"use server";

import {
  type UpdateUserSubscriptionInput,
  updateUserSubscriptionSchema,
} from "@/app/features/admin/lib/subscription.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SupabaseResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

/**
 * Updates a user's subscription
 */
export async function updateUserSubscription(
  data: UpdateUserSubscriptionInput
): Promise<SupabaseResponse<{ success: boolean }>> {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      data: null,
      error: authError,
    };
  }

  // Validate input
  const validationResult = updateUserSubscriptionSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  const { userId, subscriptionId } = validationResult.data;

  // Update user's subscription
  const { error } = await supabaseAdmin
    .from("users")
    .update({ user_subscription_id: subscriptionId })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: {
        code: error.code || "DATABASE_ERROR",
        message: error.message,
        details: error.details || "",
        hint: error.hint || "",
        name: "PostgrestError",
      },
    };
  }

  return {
    data: { success: true },
    error: null,
  };
}
