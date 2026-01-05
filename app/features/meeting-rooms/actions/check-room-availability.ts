"use server";

import { createClient } from "@/lib/supabase/server";

type CheckRoomAvailabilityInput = {
  roomId: string;
  date: string; // YYYY-MM-DD format
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
};

/**
 * Check if a room is available for a given date and optionally time range.
 * Returns true if the room is available, false otherwise.
 *
 * Checks:
 * 1. Room unavailabilities for the date
 * 2. Existing bookings that conflict with the time range (if provided)
 * 3. Buffer time requirements (30 minutes between bookings)
 */
export async function checkRoomAvailability(
  input: CheckRoomAvailabilityInput
): Promise<{ available: boolean; error?: unknown }> {
  const supabase = await createClient();

  // 1. Check for unavailabilities on the given date
  const unavailabilitiesResult = await supabase
    .from("room_unavailabilities")
    .select("unavailable_start_date, unavailable_end_date")
    .eq("meeting_room_id", input.roomId)
    .lte("unavailable_start_date", input.date)
    .gte("unavailable_end_date", input.date);

  if (unavailabilitiesResult.error) {
    return { available: false, error: unavailabilitiesResult.error };
  }

  // If room is unavailable on this date, return false
  if (unavailabilitiesResult.data && unavailabilitiesResult.data.length > 0) {
    return { available: false };
  }

  // 2. If time range is provided, check for booking conflicts
  if (input.startTime && input.endTime) {
    // Convert date and time strings to ISO timestamps
    const startDateTime = new Date(`${input.date}T${input.startTime}:00`);
    const endDateTime = new Date(`${input.date}T${input.endTime}:00`);
    const startTimeStr = startDateTime.toISOString();
    const endTimeStr = endDateTime.toISOString();

    // Calculate end time + 30 minutes (buffer requirement)
    const endTimeWithBuffer = new Date(endDateTime);
    endTimeWithBuffer.setMinutes(endTimeWithBuffer.getMinutes() + 30);
    const endTimeWithBufferStr = endTimeWithBuffer.toISOString();

    // Check for overlapping bookings
    const overlapCheck = await supabase
      .from("bookings")
      .select("booking_id")
      .eq("booking_meeting_room_id", input.roomId)
      .eq("booking_date", input.date)
      .neq("booking_payment_status", "cancelled")
      .lt("booking_start_time", endTimeStr)
      .gt("booking_end_time", startTimeStr);

    if (overlapCheck.error) {
      return { available: false, error: overlapCheck.error };
    }

    // If there are overlapping bookings, room is not available
    if (overlapCheck.data && overlapCheck.data.length > 0) {
      return { available: false };
    }

    // Check if any booking starts within 30 minutes after this booking ends
    // (ensures there's room for the buffer)
    const bufferCheck = await supabase
      .from("bookings")
      .select("booking_id")
      .eq("booking_meeting_room_id", input.roomId)
      .eq("booking_date", input.date)
      .neq("booking_payment_status", "cancelled")
      .gte("booking_start_time", endTimeStr)
      .lt("booking_start_time", endTimeWithBufferStr);

    if (bufferCheck.error) {
      return { available: false, error: bufferCheck.error };
    }

    // If there are bookings in the buffer period, room is not available
    if (bufferCheck.data && bufferCheck.data.length > 0) {
      return { available: false };
    }
  }

  return { available: true };
}
