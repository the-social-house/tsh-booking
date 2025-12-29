"use server";

import { getDeleteRoomUnavailabilityErrorMessage } from "@/app/features/admin/lib/error-messages";
import { unavailabilityIdSchema } from "@/app/features/admin/lib/meeting-room.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResult } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

/**
 * Delete a room unavailability period
 */
export async function deleteRoomUnavailability(unavailabilityId: string) {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      success: false,
      error: authError,
    };
  }

  // 1. Validate ID
  const idValidation = unavailabilityIdSchema.safeParse({
    id: unavailabilityId,
  });
  if (!idValidation.success) {
    return {
      success: false,
      error: createValidationError(idValidation.error),
    };
  }

  // 2. Perform deletion
  const result = await supabaseAdmin
    .from("room_unavailabilities")
    .delete()
    .eq("unavailability_id", unavailabilityId);

  // 3. Handle database errors
  if (result.error) {
    const errorMessage = getDeleteRoomUnavailabilityErrorMessage(
      result.error.code
    );
    return {
      success: false,
      error: { ...result.error, message: errorMessage },
    };
  }

  return toSupabaseMutationResult(result);
}
