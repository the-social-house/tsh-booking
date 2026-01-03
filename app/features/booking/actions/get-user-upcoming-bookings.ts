"use server";

import type { QueryData } from "@supabase/supabase-js";
import { requireAuth } from "@/app/features/auth/lib/require-auth";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";

// Base query used for type inference of the joined shape
async function buildUserBookingQuery() {
  const { supabase } = await requireAuth();
  if (!supabase) {
    throw new Error("Not authenticated");
  }
  return supabase
    .from("bookings")
    .select(
      "booking_id, booking_date, booking_start_time, booking_end_time, booking_number_of_people, meeting_rooms ( meeting_room_id, meeting_room_name )"
    )
    .eq("booking_user_id", ""); // Placeholder, will be replaced with actual user ID
}

export type UserUpcomingBooking = QueryData<
  ReturnType<typeof buildUserBookingQuery>
>[number];

/**
 * Fetches the current user's upcoming bookings (from today onwards).
 * Only returns bookings with payment status "paid" (excludes pending, cancelled, etc.)
 */
export async function getUserUpcomingBookings() {
  const { user, supabase, error: authError } = await requireAuth();

  if (authError || !supabase || !user) {
    return toSupabaseQueryResponse<UserUpcomingBooking[]>({
      data: null,
      error: authError || {
        code: "UNAUTHENTICATED",
        message: "User not authenticated",
        details: "",
        hint: "",
        name: "AuthError",
      },
    });
  }

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const result = await supabase
    .from("bookings")
    .select(
      "booking_id, booking_date, booking_start_time, booking_end_time, booking_number_of_people, meeting_rooms ( meeting_room_id, meeting_room_name )"
    )
    .eq("booking_user_id", user.id)
    .eq("booking_payment_status", "paid")
    .eq("booking_is_type_of_booking", "booking")
    .gte("booking_date", todayIso)
    .order("booking_date", { ascending: true })
    .order("booking_start_time", { ascending: true });

  return toSupabaseQueryResponse<UserUpcomingBooking[]>(result);
}
