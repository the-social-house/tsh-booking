"use server";

import { getDeleteRoomUnavailabilityErrorMessage } from "@/app/features/admin/lib/error-messages";
import { meetingRoomIdSchema } from "@/app/features/admin/lib/meeting-room.schema";
import { supabase } from "@/lib/supabase";
import { toSupabaseMutationResult } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

/**
 * Delete a room unavailability period
 */
export async function deleteRoomUnavailability(unavailabilityId: string) {
  // 1. Validate ID
  const idValidation = meetingRoomIdSchema.safeParse({ id: unavailabilityId });
  if (!idValidation.success) {
    return {
      success: false,
      error: createValidationError(idValidation.error),
    };
  }

  // 2. Perform deletion
  const result = await supabase
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
