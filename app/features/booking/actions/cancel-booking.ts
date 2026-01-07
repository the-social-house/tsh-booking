"use server";

import type {
  PostgrestError,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { isAdmin } from "@/app/features/auth/actions/is-admin";
import { requireAuth } from "@/app/features/auth/lib/require-auth";
import { bookingIdSchema } from "@/app/features/booking/lib/booking.schema";
import { getCancelErrorMessage } from "@/app/features/booking/lib/error-messages";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Database, Tables } from "@/supabase/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Check if user is authorized to cancel the booking
 */
async function checkCancelAuthorization(
  supabase: TypedSupabaseClient,
  user: User,
  bookingUserId: string
): Promise<{ authorized: boolean; error?: PostgrestError }> {
  const userIsAdmin = await isAdmin({ supabase, user });
  const userOwnsBooking = bookingUserId === user.id;

  if (!(userIsAdmin || userOwnsBooking)) {
    return {
      authorized: false,
      error: {
        code: "FORBIDDEN",
        message: "You can only cancel your own bookings",
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  return { authorized: true };
}

/**
 * Delete buffer slot associated with a booking
 */
async function deleteBufferSlot(
  supabase: TypedSupabaseClient,
  bookingEndTime: string,
  meetingRoomId: string
): Promise<void> {
  // Find and delete buffer slot that starts at the booking's end time
  await supabase
    .from("bookings")
    .delete()
    .eq("booking_meeting_room_id", meetingRoomId)
    .eq("booking_is_type_of_booking", "buffer")
    .eq("booking_start_time", bookingEndTime);
  // Continue even if deletion fails - buffer might not exist
}

/**
 * Decrement user's monthly booking count if booking was paid/confirmed
 */
async function decrementUserBookingCount(
  supabase: TypedSupabaseClient,
  userId: string,
  paymentStatus: string
): Promise<void> {
  // Only decrement if the booking was actually counted (status was "paid" or "confirmed")
  if (paymentStatus !== "paid" && paymentStatus !== "confirmed") {
    return;
  }

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
    await supabase
      .from("users")
      .update({
        user_current_monthly_bookings:
          userResult.data.user_current_monthly_bookings - 1,
      })
      .eq("user_id", userId);
    // Continue even if update fails - booking is already cancelled
  }
}

/**
 * Cancel a booking
 * - Users can cancel their own bookings
 * - Admins can cancel any booking
 * Sets payment_status to "cancelled" instead of deleting to maintain audit trail
 * Also decrements user's monthly booking count
 */
export async function cancelBooking(
  bookingId: string
): Promise<SupabaseResponse<Tables<"bookings">>> {
  // 1. Verify authentication and get Supabase client (ALWAYS first)
  const { user, supabase, error: authError } = await requireAuth();
  if (authError || !supabase || !user) {
    return {
      data: null,
      error: authError || {
        code: "UNAUTHENTICATED",
        message: messages.common.messages.pleaseLogIn,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // 2. Validate booking ID
  const idValidation = bookingIdSchema.safeParse({ bookingId });
  if (!idValidation.success) {
    return {
      data: null,
      error: createValidationError(idValidation.error),
    };
  }

  // 3. Check if booking is already cancelled to prevent double-decrementing
  const existingBooking = await supabase
    .from("bookings")
    .select("booking_payment_status, booking_user_id")
    .eq("booking_id", bookingId)
    .single();

  if (existingBooking.error) {
    const errorMessage = getCancelErrorMessage(existingBooking.error.code);
    return {
      data: null,
      error: {
        ...existingBooking.error,
        message: errorMessage,
      },
    };
  }

  if (!existingBooking.data) {
    const notFoundError: PostgrestError = {
      code: "PGRST116",
      message: messages.bookings.messages.error.cancel.failed,
      details: "",
      hint: "",
    } as PostgrestError;
    return { data: null, error: notFoundError };
  }

  // 3a. Check authorization: user must own the booking OR be an admin
  const authCheck = await checkCancelAuthorization(
    supabase,
    user,
    existingBooking.data.booking_user_id
  );
  if (!authCheck.authorized && authCheck.error) {
    return { data: null, error: authCheck.error };
  }

  // If already cancelled, return success without decrementing again
  if (existingBooking.data.booking_payment_status === "cancelled") {
    // Return the existing booking data
    const alreadyCancelled = await supabase
      .from("bookings")
      .select()
      .eq("booking_id", bookingId)
      .single();
    return toSupabaseMutationResponse<Tables<"bookings">>(alreadyCancelled);
  }

  // 4. Update booking status to cancelled
  const result = await supabase
    .from("bookings")
    .update({
      booking_payment_status: "cancelled",
    })
    .eq("booking_id", bookingId)
    .select()
    .single();

  // 5. Handle database errors
  if (result.error) {
    const errorMessage = getCancelErrorMessage(result.error.code);
    return {
      data: null,
      error: { ...result.error, message: errorMessage },
    };
  }

  // 6. Handle not found case
  if (!result.data) {
    const notFoundError: PostgrestError = {
      code: "PGRST116",
      message: messages.bookings.messages.error.cancel.failed,
      details: "",
      hint: "",
    } as PostgrestError;
    return { data: null, error: notFoundError };
  }

  // 7. Delete buffer slot associated with this booking
  await deleteBufferSlot(
    supabase,
    result.data.booking_end_time,
    result.data.booking_meeting_room_id
  );

  // 8. Decrement user's monthly bookings count (only if booking was paid/confirmed)
  await decrementUserBookingCount(
    supabase,
    result.data.booking_user_id,
    existingBooking.data.booking_payment_status
  );

  return toSupabaseMutationResponse<Tables<"bookings">>(result);
}
