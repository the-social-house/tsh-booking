"use server";

import { getCreateRoomUnavailabilityErrorMessage } from "@/app/features/admin/lib/error-messages";
import {
  createRoomUnavailabilitySchema,
  meetingRoomIdSchema,
} from "@/app/features/admin/lib/meeting-room.schema";
import {
  checkBookingConflicts,
  checkOverlappingUnavailabilities,
  createBookingConflictError,
  createOverlappingDatesError,
} from "@/app/features/admin/lib/unavailability-validation";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";

/**
 * Create a new room unavailability period
 */
export async function createRoomUnavailability(
  meetingRoomId: string,
  data: {
    unavailable_start_date: string;
    unavailable_end_date: string;
    unavailability_reason?: string | null;
  }
) {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      data: null,
      error: authError || {
        code: "FORBIDDEN",
        message: messages.common.messages.adminRequired,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // 1. Validate meeting room ID
  const idValidation = meetingRoomIdSchema.safeParse({ id: meetingRoomId });
  if (!idValidation.success) {
    return {
      data: null,
      error: createValidationError(idValidation.error),
    };
  }

  // 2. Validate unavailability data
  const dataValidation = createRoomUnavailabilitySchema.safeParse(data);
  if (!dataValidation.success) {
    return {
      data: null,
      error: createValidationError(dataValidation.error),
    };
  }

  // 3. Check for overlapping unavailabilities
  const overlapCheck = await checkOverlappingUnavailabilities(
    meetingRoomId,
    dataValidation.data.unavailable_start_date,
    dataValidation.data.unavailable_end_date
  );

  if (overlapCheck.error) {
    return {
      data: null,
      error: overlapCheck.error,
    };
  }

  if (overlapCheck.hasOverlap) {
    return {
      data: null,
      error: await createOverlappingDatesError(),
    };
  }

  // 4. Check for booking conflicts
  const bookingCheck = await checkBookingConflicts(
    meetingRoomId,
    dataValidation.data.unavailable_start_date,
    dataValidation.data.unavailable_end_date
  );

  if (bookingCheck.error) {
    return {
      data: null,
      error: bookingCheck.error,
    };
  }

  if (bookingCheck.hasConflict) {
    return {
      data: null,
      error: await createBookingConflictError(),
    };
  }

  // 5. Perform database operation
  const result = await supabaseAdmin
    .from("room_unavailabilities")
    .insert({
      meeting_room_id: meetingRoomId,
      unavailable_start_date: dataValidation.data.unavailable_start_date,
      unavailable_end_date: dataValidation.data.unavailable_end_date,
      unavailability_reason: dataValidation.data.unavailability_reason || null,
    })
    .select()
    .single();

  // 6. Handle database errors
  if (result.error) {
    const errorMessage = getCreateRoomUnavailabilityErrorMessage(
      result.error.code
    );
    return {
      data: null,
      error: { ...result.error, message: errorMessage },
    };
  }

  return toSupabaseMutationResponse<Tables<"room_unavailabilities">>(result);
}
