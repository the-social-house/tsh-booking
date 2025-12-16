"use server";

import { supabase } from "@/lib/supabase";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import {
  type GetBookingsInput,
  getBookingsSchema,
} from "../lib/booking.schema";

/**
 * Booking data returned for conflict checking
 */
export type BookingSlot = {
  booking_date: string;
  booking_start_time: string;
  booking_end_time: string;
};

/**
 * Fetches bookings with optional filters for room and date range.
 * Excludes cancelled bookings (only returns pending and confirmed).
 *
 * @param filters - Optional filters for roomId, startDate, and endDate
 * @returns Array of bookings with date and time information
 */
export async function getBookings(filters?: GetBookingsInput) {
  // Validate filters if provided
  if (filters) {
    const validationResult = getBookingsSchema.safeParse(filters);
    if (!validationResult.success) {
      return {
        data: null,
        error: createValidationError(validationResult.error),
      };
    }
  }

  // Build query
  let query = supabase
    .from("bookings")
    .select("booking_date, booking_start_time, booking_end_time")
    .neq("booking_payment_status", "cancelled"); // Exclude cancelled bookings

  // Apply room filter if provided
  if (filters?.roomId) {
    query = query.eq("booking_meeting_room_id", filters.roomId);
  }

  // Apply date range filters if provided
  if (filters?.startDate) {
    query = query.gte("booking_date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("booking_date", filters.endDate);
  }

  // Order by date and start time for easier processing
  query = query.order("booking_date").order("booking_start_time");

  const result = await query;

  return toSupabaseQueryResponse<BookingSlot[]>(result);
}
