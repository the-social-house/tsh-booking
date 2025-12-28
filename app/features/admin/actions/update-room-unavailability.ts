"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { getUpdateRoomUnavailabilityErrorMessage } from "@/app/features/admin/lib/error-messages";
import {
  unavailabilityIdSchema,
  updateRoomUnavailabilitySchema,
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
import { hasData, toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";

/**
 * Create a not found error for unavailability operations
 */
function createNotFoundError(): PostgrestError {
  return {
    code: "PGRST116",
    message:
      messages.admin.meetingRooms.messages.error.unavailabilityUpdate.notFound,
    details: "",
    hint: "",
  } as PostgrestError;
}

type UnavailabilityData = {
  meeting_room_id: string;
  unavailable_start_date: string;
  unavailable_end_date: string;
};

/**
 * Get current unavailability record or return error
 */
async function getCurrentUnavailability(unavailabilityId: string) {
  const currentResult = await supabaseAdmin
    .from("room_unavailabilities")
    .select("meeting_room_id, unavailable_start_date, unavailable_end_date")
    .eq("unavailability_id", unavailabilityId)
    .single();

  if (currentResult.error || !hasData(currentResult)) {
    return {
      data: null,
      error: createNotFoundError(),
    };
  }

  return { data: currentResult.data as UnavailabilityData, error: null };
}

/**
 * Validate date changes for overlaps and booking conflicts
 */
async function validateDateChanges(
  meetingRoomId: string,
  startDate: string,
  endDate: string,
  excludeUnavailabilityId: string
) {
  const overlapCheck = await checkOverlappingUnavailabilities(
    meetingRoomId,
    startDate,
    endDate,
    excludeUnavailabilityId
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
      error: await createOverlappingDatesError(true),
    };
  }

  const bookingCheck = await checkBookingConflicts(
    meetingRoomId,
    startDate,
    endDate
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
      error: await createBookingConflictError(true),
    };
  }

  return { data: true, error: null };
}

/**
 * Update a room unavailability period
 */
export async function updateRoomUnavailability(
  unavailabilityId: string,
  data: {
    unavailable_start_date?: string;
    unavailable_end_date?: string;
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

  // 1. Validate unavailability ID
  const idValidation = unavailabilityIdSchema.safeParse({
    id: unavailabilityId,
  });
  if (!idValidation.success) {
    return {
      data: null,
      error: createValidationError(idValidation.error),
    };
  }

  // 2. Validate update data
  const dataValidation = updateRoomUnavailabilitySchema.safeParse(data);
  if (!dataValidation.success) {
    return {
      data: null,
      error: createValidationError(dataValidation.error),
    };
  }

  // 3. Get current unavailability
  const currentResult = await getCurrentUnavailability(unavailabilityId);
  if (currentResult.error) {
    return currentResult;
  }

  const current = currentResult.data;
  const meetingRoomId = current.meeting_room_id;

  // 4. Determine final dates (use updated values if provided, otherwise current values)
  const finalStartDate =
    dataValidation.data.unavailable_start_date ??
    current.unavailable_start_date;
  const finalEndDate =
    dataValidation.data.unavailable_end_date ?? current.unavailable_end_date;

  // 5. Validate date changes if dates are being updated
  if (
    dataValidation.data.unavailable_start_date ||
    dataValidation.data.unavailable_end_date
  ) {
    const validationResult = await validateDateChanges(
      meetingRoomId,
      finalStartDate,
      finalEndDate,
      unavailabilityId
    );
    if (validationResult.error) {
      return validationResult;
    }
  }

  // 6. Perform database operation
  const result = await supabaseAdmin
    .from("room_unavailabilities")
    .update(dataValidation.data)
    .eq("unavailability_id", unavailabilityId)
    .select()
    .single();

  // 7. Handle database errors
  if (result.error) {
    const errorMessage = getUpdateRoomUnavailabilityErrorMessage(
      result.error.code
    );
    return {
      data: null,
      error: { ...result.error, message: errorMessage },
    };
  }

  // 8. Handle not found case
  if (!result.data) {
    return { data: null, error: createNotFoundError() };
  }

  return toSupabaseMutationResponse<Tables<"room_unavailabilities">>(result);
}
