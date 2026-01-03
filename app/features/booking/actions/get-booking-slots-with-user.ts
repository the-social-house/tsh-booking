"use server";

import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";

// Base query used for type inference of the joined shape
// Uses the foreign key bookings_booking_user_id_fkey to join users
async function buildBookingQuery() {
  const supabase = await createClient();
  return supabase
    .from("bookings")
    .select(
      "booking_id, booking_user_id, booking_meeting_room_id, booking_start_time, booking_end_time, booking_date, booking_payment_status, booking_is_type_of_booking, users ( user_id, user_company_name )"
    );
}

export type BookingWithUser = QueryData<
  ReturnType<typeof buildBookingQuery>
>[number];

export async function getBookingSlotsWithUser() {
  const supabase = await createClient();
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10); // YYYY-MM-DD

  // Query for paid bookings OR buffer bookings (buffers have status "confirmed")
  // Using .in() to include both "paid" and "confirmed" statuses, which covers:
  // - Paid bookings (status: "paid", type: "booking")
  // - Buffer slots (status: "confirmed", type: "buffer")
  const result = await supabase
    .from("bookings")
    .select(
      "booking_id, booking_user_id, booking_meeting_room_id, booking_start_time, booking_end_time, booking_date, booking_payment_status, booking_is_type_of_booking, users ( user_id, user_company_name )"
    )
    .in("booking_payment_status", ["paid", "confirmed"])
    .gte("booking_date", todayIso)
    .order("booking_date")
    .order("booking_start_time");

  return toSupabaseQueryResponse<BookingWithUser[]>(result);
}
