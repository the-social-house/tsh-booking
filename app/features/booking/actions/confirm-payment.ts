"use server";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { requireAuth } from "@/app/features/auth/lib/require-auth";
import messages from "@/lib/messages.json";
import { stripe } from "@/lib/stripe";
import type { SupabaseResponse } from "@/lib/supabase-response";
import type { Database } from "@/supabase/types/database";
import { createBufferSlot } from "./create-booking";

type TypedSupabaseClient = SupabaseClient<Database>;

export type ConfirmPaymentInput = {
  /**
   * Payment Intent ID from Stripe
   */
  paymentIntentId: string;
  /**
   * Booking ID to update (UUID)
   */
  bookingId: string;
};

/**
 * Get receipt URL from Stripe charge if available
 */
async function getReceiptUrl(
  paymentIntent: Stripe.PaymentIntent
): Promise<string | null> {
  if (!paymentIntent.latest_charge) {
    return null;
  }

  const charge = await stripe.charges.retrieve(
    paymentIntent.latest_charge as string
  );
  return charge.receipt_url;
}

/**
 * Create error response for payment confirmation failures
 */
function createPaymentError(code: string, message: string): PostgrestError {
  return {
    name: "PostgrestError",
    code,
    message,
    details: "",
    hint: "",
  } as PostgrestError;
}

/**
 * Update booking with payment information
 */
async function updateBookingWithPayment(
  supabase: TypedSupabaseClient,
  bookingId: string,
  paymentIntentId: string,
  receiptUrl: string | null
) {
  return await supabase
    .from("bookings")
    .update({
      booking_payment_status: "paid",
      booking_stripe_transaction_id: paymentIntentId,
      booking_receipt_url: receiptUrl,
    })
    .eq("booking_id", bookingId)
    .select()
    .single();
}

/**
 * Create buffer slot for confirmed booking
 */
async function createBufferForBooking(
  supabase: TypedSupabaseClient,
  bookingData: {
    booking_id: string;
    booking_user_id: string;
    booking_meeting_room_id: string;
    booking_start_time: string;
    booking_end_time: string;
  }
): Promise<void> {
  const bookingEndTime = new Date(bookingData.booking_end_time);
  const bookingStartTime = new Date(bookingData.booking_start_time);

  // Safety check: Verify the end time is actually after the start time
  if (bookingEndTime <= bookingStartTime) {
    return;
  }

  const bufferResult = await createBufferSlot(supabase, {
    roomId: bookingData.booking_meeting_room_id,
    userId: bookingData.booking_user_id,
    bookingEndTime,
    bookingId: bookingData.booking_id,
  });

  // Buffer creation failed, but payment succeeded
  // Log the error but don't fail the payment confirmation
  // The booking is still valid without the buffer
  if (!bufferResult.success && bufferResult.error) {
    // In production, you might want to handle this more gracefully
  }
}

/**
 * Confirm payment and update booking with Stripe transaction details
 */
export async function confirmPayment(
  data: ConfirmPaymentInput
): Promise<SupabaseResponse<{ success: boolean }>> {
  // Verify authentication and get Supabase client
  const { supabase, error: authError } = await requireAuth();
  if (authError || !supabase) {
    return {
      data: null,
      error:
        authError ||
        createPaymentError(
          "UNAUTHENTICATED",
          "You must be logged in to confirm payment"
        ),
    };
  }

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      data.paymentIntentId
    );

    // Verify payment was successful
    if (paymentIntent.status !== "succeeded") {
      return {
        data: null,
        error: createPaymentError(
          "PAYMENT_NOT_SUCCEEDED",
          messages.bookings.messages.error.payment.notSucceeded
        ),
      };
    }

    // Get receipt URL from charge if available
    const receiptUrl = await getReceiptUrl(paymentIntent);

    // Update booking with payment information
    const updateResult = await updateBookingWithPayment(
      supabase,
      data.bookingId,
      paymentIntent.id,
      receiptUrl
    );

    if (updateResult.error) {
      return {
        data: null,
        error: createPaymentError(
          updateResult.error.code || "UPDATE_FAILED",
          messages.bookings.messages.error.payment.updateFailed
        ),
      };
    }

    // Verify we got data back
    if (!updateResult.data) {
      return {
        data: null,
        error: createPaymentError(
          "PGRST116",
          messages.bookings.messages.error.payment.bookingNotFound
        ),
      };
    }

    // Create buffer slot after payment is confirmed
    // This ensures buffers are only created for paid bookings
    await createBufferForBooking(supabase, updateResult.data);

    return {
      data: { success: true },
      error: null,
    };
  } catch {
    return {
      data: null,
      error: createPaymentError(
        "CONFIRM_PAYMENT_ERROR",
        messages.bookings.messages.error.payment.confirmFailed
      ),
    };
  }
}
