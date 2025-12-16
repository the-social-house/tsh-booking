"use server";

import type { QueryData } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";

// Base query used for type inference of the joined shape
// Uses the foreign key bookings_booking_user_id_fkey to join users
const bookingSlotsWithUserQuery = supabase
  .from("bookings")
  .select(
    "booking_id, booking_user_id, booking_meeting_room_id, booking_start_time, booking_end_time, booking_date, booking_payment_status, users ( user_id, user_username )"
  );

export type BookingWithUser = QueryData<
  typeof bookingSlotsWithUserQuery
>[number];

export async function getBookingSlotsWithUser() {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const result = await bookingSlotsWithUserQuery
    .eq("booking_payment_status", "paid")
    .gte("booking_date", todayIso)
    .order("booking_date")
    .order("booking_start_time");

  return toSupabaseQueryResponse<QueryData<typeof bookingSlotsWithUserQuery>>(
    result
  );
}
