"use server";

import { getDeleteMeetingRoomErrorMessage } from "@/app/features/admin/lib/error-messages";
import { meetingRoomIdSchema } from "@/app/features/admin/lib/meeting-room.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { toSupabaseMutationResult } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

/**
 * Delete a meeting room by ID
 */
export async function deleteMeetingRoom(id: string) {
  // Verify admin access and get Supabase client
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return {
      success: false,
      error: authError || {
        code: "FORBIDDEN",
        message: "You must be an admin to perform this action",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  const validationResult = meetingRoomIdSchema.safeParse({ id });
  if (!validationResult.success) {
    return {
      success: false,
      error: createValidationError(validationResult.error),
    };
  }

  const amenitiesResult = await supabase
    .from("meeting_room_amenities")
    .delete()
    .eq("meeting_room_id", id);

  if (amenitiesResult.error) {
    const errorMessage = getDeleteMeetingRoomErrorMessage(
      amenitiesResult.error.code
    );
    return {
      success: false,
      error: { ...amenitiesResult.error, message: errorMessage },
    };
  }

  const result = await supabase
    .from("meeting_rooms")
    .delete()
    .eq("meeting_room_id", id);

  if (result.error) {
    const errorMessage = getDeleteMeetingRoomErrorMessage(result.error.code);
    return {
      success: false,
      error: { ...result.error, message: errorMessage },
    };
  }

  return toSupabaseMutationResult(result);
}
