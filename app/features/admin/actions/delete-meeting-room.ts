"use server";

import { getDeleteMeetingRoomErrorMessage } from "@/app/features/admin/lib/error-messages";
import { meetingRoomIdSchema } from "@/app/features/admin/lib/meeting-room.schema";
import { supabase } from "@/lib/supabase";
import { toSupabaseMutationResult } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

/**
 * Delete a meeting room by ID
 */
export async function deleteMeetingRoom(id: number) {
  // 1. Validate ID
  const validationResult = meetingRoomIdSchema.safeParse({ id });
  if (!validationResult.success) {
    return {
      success: false,
      error: createValidationError(validationResult.error),
    };
  }

  // 2. Perform deletion
  const result = await supabase
    .from("meeting_rooms")
    .delete()
    .eq("meeting_room_id", id);

  // 3. Handle database errors
  if (result.error) {
    const errorMessage = getDeleteMeetingRoomErrorMessage(result.error.code);
    return {
      success: false,
      error: { ...result.error, message: errorMessage },
    };
  }

  return toSupabaseMutationResult(result);
}
