"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import messages from "@/lib/messages.json";
import { supabase } from "@/lib/supabase";
import { hasData } from "@/lib/supabase-response";

/**
 * Check if two date ranges overlap
 * Two ranges overlap if: start1 <= end2 AND start2 <= end1
 */
function dateRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);

  return s1 <= e2 && s2 <= e1;
}

/**
 * Check if there are overlapping unavailability periods for a room
 */
export async function checkOverlappingUnavailabilities(
  meetingRoomId: string,
  startDate: string,
  endDate: string,
  excludeUnavailabilityId?: string
): Promise<{ hasOverlap: boolean; error?: PostgrestError }> {
  try {
    // Get all existing unavailabilities for this room
    // Note: Using type assertion until types are regenerated
    let query = supabase
      .from("room_unavailabilities" as never)
      .select("unavailability_id, unavailable_start_date, unavailable_end_date")
      .eq("meeting_room_id", meetingRoomId);

    // Exclude the current unavailability if updating
    if (excludeUnavailabilityId) {
      query = query.neq("unavailability_id", excludeUnavailabilityId);
    }

    const result = await query;

    if (result.error) {
      return { hasOverlap: false, error: result.error };
    }

    if (!hasData(result)) {
      return { hasOverlap: false };
    }

    // Check if any existing unavailability overlaps with the new/updated range
    type UnavailabilityRow = {
      unavailability_id: string;
      unavailable_start_date: string;
      unavailable_end_date: string;
    };
    const hasOverlap = (result.data as UnavailabilityRow[]).some(
      (unavailability) =>
        dateRangesOverlap(
          startDate,
          endDate,
          unavailability.unavailable_start_date,
          unavailability.unavailable_end_date
        )
    );

    return { hasOverlap };
  } catch (error) {
    const postgrestError: PostgrestError = {
      code: "UNKNOWN",
      message: "Error checking for overlapping unavailabilities",
      details: String(error),
      hint: "",
    } as PostgrestError;
    return { hasOverlap: false, error: postgrestError };
  }
}

/**
 * Check if there are bookings during the unavailability period
 */
export async function checkBookingConflicts(
  meetingRoomId: string,
  startDate: string,
  endDate: string
): Promise<{ hasConflict: boolean; error?: PostgrestError }> {
  try {
    // Get all non-cancelled bookings for this room within the date range
    const result = await supabase
      .from("bookings")
      .select("booking_id, booking_date")
      .eq("booking_meeting_room_id", meetingRoomId)
      .neq("booking_payment_status", "cancelled")
      .gte("booking_date", startDate)
      .lte("booking_date", endDate);

    if (result.error) {
      return { hasConflict: false, error: result.error };
    }

    if (!hasData(result)) {
      return { hasConflict: false };
    }

    // If there are any bookings, there's a conflict
    return { hasConflict: result.data.length > 0 };
  } catch (error) {
    const postgrestError: PostgrestError = {
      code: "UNKNOWN",
      message: "Error checking for booking conflicts",
      details: String(error),
      hint: "",
    } as PostgrestError;
    return { hasConflict: false, error: postgrestError };
  }
}

/**
 * Create a custom error for overlapping dates
 */
export async function createOverlappingDatesError(
  isUpdate = false
): Promise<PostgrestError> {
  await Promise.resolve(); // Required for Next.js server action
  return {
    code: "OVERLAPPING_DATES",
    message: isUpdate
      ? messages.admin.meetingRooms.messages.error.unavailabilityUpdate
          .overlappingDates
      : messages.admin.meetingRooms.messages.error.unavailabilityCreate
          .overlappingDates,
    details: "",
    hint: "",
  } as PostgrestError;
}

/**
 * Create a custom error for booking conflicts
 */
export async function createBookingConflictError(
  isUpdate = false
): Promise<PostgrestError> {
  await Promise.resolve(); // Required for Next.js server action
  return {
    code: "BOOKING_CONFLICT",
    message: isUpdate
      ? messages.admin.meetingRooms.messages.error.unavailabilityUpdate
          .bookingConflict
      : messages.admin.meetingRooms.messages.error.unavailabilityCreate
          .bookingConflict,
    details: "",
    hint: "",
  } as PostgrestError;
}
