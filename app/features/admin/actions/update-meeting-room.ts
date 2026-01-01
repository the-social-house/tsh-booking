"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { getUpdateMeetingRoomErrorMessage } from "@/app/features/admin/lib/error-messages";
import {
  meetingRoomIdSchema,
  type UpdateMeetingRoomInput,
  updateMeetingRoomSchema,
} from "@/app/features/admin/lib/meeting-room.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";

/**
 * Update a meeting room by ID
 */
export async function updateMeetingRoom(
  id: string,
  data: UpdateMeetingRoomInput
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
  const idValidation = meetingRoomIdSchema.safeParse({ id });
  if (!idValidation.success) {
    return {
      data: null,
      error: createValidationError(idValidation.error),
    };
  }

  // 2. Validate update data
  const dataValidation = updateMeetingRoomSchema.safeParse(data);
  if (!dataValidation.success) {
    return {
      data: null,
      error: createValidationError(dataValidation.error),
    };
  }

  // 3. Perform database operation with validated data
  const validatedData = dataValidation.data;

  const result = await supabaseAdmin
    .from("meeting_rooms")
    .update(validatedData)
    .eq("meeting_room_id", id)
    .select()
    .single();

  // 4. Handle database errors
  if (result.error) {
    const errorMessage = getUpdateMeetingRoomErrorMessage(result.error.code);
    return {
      data: null,
      error: { ...result.error, message: errorMessage },
    };
  }

  // 5. Handle not found case
  if (!result.data) {
    const notFoundError: PostgrestError = {
      code: "PGRST116",
      message: messages.admin.meetingRooms.messages.error.update.notFound,
      details: "",
      hint: "",
    } as PostgrestError;

    return { data: null, error: notFoundError };
  }

  return toSupabaseMutationResponse<Tables<"meeting_rooms">>(result);
}
