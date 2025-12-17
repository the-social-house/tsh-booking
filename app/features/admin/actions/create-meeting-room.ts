"use server";

import { getCreateMeetingRoomErrorMessage } from "@/app/features/admin/lib/error-messages";
import {
  type CreateMeetingRoomInput,
  createMeetingRoomSchema,
} from "@/app/features/admin/lib/meeting-room.schema";
import { supabase } from "@/lib/supabase";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";

/**
 * Map database error codes to field names for visual error styling
 */
function getFieldForDatabaseError(errorCode: string): string | null {
  const fieldMap: Record<string, string> = {
    // 23505 = unique violation - meeting_room_name is the only unique field
    "23505": "meeting_room_name",
  };
  return fieldMap[errorCode] ?? null;
}

export async function createMeetingRoom(data: CreateMeetingRoomInput) {
  // 1. Validate input with Zod
  const validationResult = createMeetingRoomSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  // 2. Use validated data for database operation
  const validatedData = validationResult.data;

  const result = await supabase
    .from("meeting_rooms")
    .insert(validatedData)
    .select()
    .single();

  // 3. Handle database errors with user-friendly messages and field mapping
  if (result.error) {
    const errorMessage = getCreateMeetingRoomErrorMessage(result.error.code);
    const errorField = getFieldForDatabaseError(result.error.code);

    // Include field info in details so parseFieldErrors can extract it
    const details = errorField
      ? JSON.stringify([{ path: [errorField], message: errorMessage }])
      : result.error.details;

    return {
      data: null,
      error: { ...result.error, message: errorMessage, details },
    };
  }

  return toSupabaseMutationResponse<Tables<"meeting_rooms">>(result);
}
