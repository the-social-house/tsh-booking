"use server";

import { getDeleteMeetingRoomErrorMessage } from "@/app/features/admin/lib/error-messages";
import { meetingRoomIdSchema } from "@/app/features/admin/lib/meeting-room.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResult } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

/**
 * Delete a meeting room by ID
 */
export async function deleteMeetingRoom(id: string) {
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

  const validationResult = meetingRoomIdSchema.safeParse({ id });
  if (!validationResult.success) {
    return {
      success: false,
      error: createValidationError(validationResult.error),
    };
  }

  const amenitiesResult = await supabaseAdmin
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

  const result = await supabaseAdmin
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
