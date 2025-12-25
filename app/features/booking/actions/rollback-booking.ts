"use server";

import { requireAuth } from "@/app/features/auth/lib/require-auth";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";

/**
 * Rollback a booking by deleting all associated data:
 * - Booking amenities (junction table entries)
 * - Buffer slot (if created)
 * - Decrement user's monthly bookings count
 * - Delete the booking itself
 *
 * This is used when any step in the booking process fails.
 */
export async function rollbackBooking(
  bookingId: string,
  userId: string
): Promise<SupabaseResponse<{ success: boolean }>> {
  // Verify authentication and get Supabase client
  const { supabase, error: authError } = await requireAuth();
  if (authError || !supabase) {
    return {
      data: null,
      error: authError || {
        code: "UNAUTHENTICATED",
        message: "You must be logged in to rollback a booking",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  try {
    // Step 1: Delete booking amenities (junction table)
    const deleteAmenitiesResult = await supabase
      .from("booking_amenities")
      .delete()
      .eq("booking_id", bookingId);

    if (deleteAmenitiesResult.error) {
      // Continue - we still want to delete the booking
    }

    // Step 2: Find and delete buffer slot (if exists)
    // Buffer slots are created with booking_is_type_of_booking = 'buffer'
    // and are associated with the booking's end time
    const bookingResult = await supabase
      .from("bookings")
      .select("booking_end_time, booking_meeting_room_id")
      .eq("booking_id", bookingId)
      .single();

    if (bookingResult.data) {
      // Find buffer slot that starts at the booking's end time
      const bufferResult = await supabase
        .from("bookings")
        .delete()
        .eq(
          "booking_meeting_room_id",
          bookingResult.data.booking_meeting_room_id
        )
        .eq("booking_is_type_of_booking", "buffer")
        .eq("booking_start_time", bookingResult.data.booking_end_time);

      if (bufferResult.error) {
        // Continue - buffer might not exist
      }
    }

    // Step 3: Decrement user's monthly bookings count
    // First, get current count
    const userResult = await supabase
      .from("users")
      .select("user_current_monthly_bookings")
      .eq("user_id", userId)
      .single();

    if (
      userResult.data &&
      userResult.data.user_current_monthly_bookings !== null &&
      userResult.data.user_current_monthly_bookings > 0
    ) {
      const updateUserResult = await supabase
        .from("users")
        .update({
          user_current_monthly_bookings:
            userResult.data.user_current_monthly_bookings - 1,
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (updateUserResult.error) {
        // Continue - we still want to delete the booking
      }
    }

    // Step 4: Delete the booking itself
    const deleteBookingResult = await supabase
      .from("bookings")
      .delete()
      .eq("booking_id", bookingId)
      .select()
      .single();

    if (deleteBookingResult.error) {
      return {
        data: null,
        error: {
          name: "PostgrestError",
          code: deleteBookingResult.error.code || "ROLLBACK_FAILED",
          message: messages.bookings.messages.error.rollback.failed,
          details: "",
          hint: "",
        },
      };
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch {
    return {
      data: null,
      error: {
        name: "PostgrestError",
        code: "ROLLBACK_ERROR",
        message: messages.bookings.messages.error.rollback.failed,
        details: "",
        hint: "",
      },
    };
  }
}
