"use server";

import type { QueryData } from "@supabase/supabase-js";
import { z } from "zod";
import { requireAuth } from "@/app/features/auth/lib/require-auth";
import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

// Schema for booking ID validation
const getBookingByIdSchema = z.object({
  bookingId: z.uuid("Invalid booking ID"),
});

// Helper function to build the query (used for type inference)
async function buildBookingQuery(bookingId: string) {
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
        user_company_name,
        user_email
      ),
      meeting_rooms (
        meeting_room_id,
        meeting_room_name,
        meeting_room_images
      ),
      booking_amenities (
        amenity_id,
        amenities (
          amenity_id,
          amenity_name,
          amenity_price
        )
      )
    `
    )
    .eq("booking_id", bookingId)
    .single();
}

export type BookingWithDetails = QueryData<
  ReturnType<typeof buildBookingQuery>
>;

/**
 * Fetches a booking by ID with user and meeting room information.
 * Only returns bookings that belong to the authenticated user.
 */
export async function getBookingById(bookingId: string) {
  // 1. Verify authentication
  const { user, supabase, error: authError } = await requireAuth();
  if (authError || !supabase || !user) {
    return {
      data: null,
      error: authError || {
        code: "UNAUTHENTICATED",
        message: "You must be logged in to view booking details",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // 2. Validate booking ID
  const validationResult = getBookingByIdSchema.safeParse({ bookingId });
  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  // 3. Query database
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
        user_company_name,
        user_email
      ),
      meeting_rooms (
        meeting_room_id,
        meeting_room_name,
        meeting_room_images
      ),
      booking_amenities (
        amenity_id,
        amenities (
          amenity_id,
          amenity_name,
          amenity_price
        )
      )
    `
    )
    .eq("booking_id", bookingId)
    .eq("booking_user_id", user.id) // Ensure user can only see their own bookings
    .single();

  return toSupabaseQueryResponse<BookingWithDetails>(result);
}
