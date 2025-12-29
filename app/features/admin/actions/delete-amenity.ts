"use server";

import { amenityIdSchema } from "@/app/features/admin/lib/amenity.schema";
import { getDeleteAmenityErrorMessage } from "@/app/features/admin/lib/error-messages";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResult } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

/**
 * Delete an amenity by ID
 */
export async function deleteAmenity(id: string) {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      success: false,
      error: authError || {
        code: "FORBIDDEN",
        message: messages.common.messages.adminRequired,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  const validationResult = amenityIdSchema.safeParse({ id });
  if (!validationResult.success) {
    return {
      success: false,
      error: createValidationError(validationResult.error),
    };
  }

  const result = await supabaseAdmin
    .from("amenities")
    .delete()
    .eq("amenity_id", id);

  if (result.error) {
    const errorMessage = getDeleteAmenityErrorMessage(result.error.code);
    return {
      success: false,
      error: { ...result.error, message: errorMessage },
    };
  }

  return toSupabaseMutationResult(result);
}
