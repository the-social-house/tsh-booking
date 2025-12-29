"use server";

import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";

// Base query used for type inference of the joined shape
async function buildAdminBookingQuery() {
  const supabase = await createClient();
  return supabase
    .from("bookings")
    .select(
      `
      booking_id,
      booking_user_id,
      booking_meeting_room_id,
      booking_start_time,
      booking_end_time,
      booking_created_at,
      booking_date,
      booking_is_type_of_booking,
      booking_number_of_people,
      booking_total_price,
      booking_discount,
      booking_payment_status,
      booking_stripe_transaction_id,
      booking_receipt_url,
      users (
        user_id,
        user_username,
        user_email
      ),
      meeting_rooms (
        meeting_room_id,
        meeting_room_name
      )
    `
    )
    .eq("booking_is_type_of_booking", "booking")
    .order("booking_date", { ascending: true })
    .order("booking_start_time", { ascending: true });
}

export type AdminBooking = QueryData<
  ReturnType<typeof buildAdminBookingQuery>
>[number];

/**
 * Fetches all bookings for admin view with user and meeting room information
 * Also fetches buffer bookings for lookup in the buffer column
 */
export async function getAllBookings() {
  const supabase = await createClient();

  const result = await supabase
    .from("bookings")
    .select(
      `
      booking_id,
      booking_user_id,
      booking_meeting_room_id,
      booking_start_time,
      booking_end_time,
      booking_created_at,
      booking_date,
      booking_is_type_of_booking,
      booking_number_of_people,
      booking_total_price,
      booking_discount,
      booking_payment_status,
      booking_stripe_transaction_id,
      booking_receipt_url,
      users (
        user_id,
        user_username,
        user_email
      ),
      meeting_rooms (
        meeting_room_id,
        meeting_room_name
      )
    `
    )
    .eq("booking_is_type_of_booking", "booking")
    .order("booking_date", { ascending: true })
    .order("booking_start_time", { ascending: true });

  // Also fetch buffer bookings for the buffer column lookup
  const buffersResult = await supabase
    .from("bookings")
    .select("booking_meeting_room_id, booking_start_time, booking_end_time")
    .eq("booking_is_type_of_booking", "buffer")
    .neq("booking_payment_status", "cancelled");

  const bookingsResponse = toSupabaseQueryResponse<AdminBooking[]>(result);

  // If bookings query failed, return the error
  if (bookingsResponse.error || !bookingsResponse.data) {
    return bookingsResponse;
  }

  // Create a map of buffers for quick lookup: key = "roomId|startTime"
  const buffersMap = new Map<
    string,
    { start_time: string; end_time: string }
  >();
  if (buffersResult.data) {
    for (const buffer of buffersResult.data) {
      if (
        buffer.booking_meeting_room_id &&
        buffer.booking_start_time &&
        buffer.booking_end_time
      ) {
        const key = `${buffer.booking_meeting_room_id}|${buffer.booking_start_time}`;
        buffersMap.set(key, {
          start_time: buffer.booking_start_time,
          end_time: buffer.booking_end_time,
        });
      }
    }
  }

  // Attach buffers map to the response data
  return {
    ...bookingsResponse,
    data: bookingsResponse.data.map((booking) => ({
      ...booking,
      _buffersMap: buffersMap,
    })),
  };
}
