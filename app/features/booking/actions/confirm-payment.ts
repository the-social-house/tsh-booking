"use server";

import { requireAuth } from "@/app/features/auth/lib/require-auth";
import messages from "@/lib/messages.json";
import { stripe } from "@/lib/stripe";
import type { SupabaseResponse } from "@/lib/supabase-response";

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
      error: authError || {
        code: "UNAUTHENTICATED",
        message: "You must be logged in to confirm payment",
        details: "",
        hint: "",
        name: "AuthError",
      },
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
        error: {
          name: "PostgrestError",
          code: "PAYMENT_NOT_SUCCEEDED",
          message: messages.bookings.messages.error.payment.notSucceeded,
          details: "",
          hint: "",
        },
      };
    }

    // Get receipt URL from charge if available
    let receiptUrl: string | null = null;
    if (paymentIntent.latest_charge) {
      const charge = await stripe.charges.retrieve(
        paymentIntent.latest_charge as string
      );
      receiptUrl = charge.receipt_url;
    }

    // Update booking with payment information
    // Use .single() as per Supabase best practices - it will throw an error if no rows match
    const updateResult = await supabase
      .from("bookings")
      .update({
        booking_payment_status: "paid",
        booking_stripe_transaction_id: paymentIntent.id,
        booking_receipt_url: receiptUrl,
      })
      .eq("booking_id", data.bookingId)
      .select()
      .single();

    if (updateResult.error) {
      // Payment succeeded but we couldn't update the booking
      // This is a critical error - we need to rollback
      // Get the user ID from the booking before rolling back
      const bookingCheck = await supabase
        .from("bookings")
        .select("booking_user_id")
        .eq("booking_id", data.bookingId)
        .single();

      if (bookingCheck.data) {
        // Import and call rollback (will be handled by caller)
        // Return error with rollback flag
        return {
          data: null,
          error: {
            name: "PostgrestError",
            code: updateResult.error.code || "UPDATE_FAILED",
            message: messages.bookings.messages.error.payment.updateFailed,
            details: "",
            hint: "",
          },
        };
      }

      return {
        data: null,
        error: {
          name: "PostgrestError",
          code: updateResult.error.code || "UPDATE_FAILED",
          message: messages.bookings.messages.error.payment.updateFailed,
          details: "",
          hint: "",
        },
      };
    }

    // Verify we got data back
    if (!updateResult.data) {
      return {
        data: null,
        error: {
          name: "PostgrestError",
          code: "PGRST116",
          message: messages.bookings.messages.error.payment.bookingNotFound,
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
        code: "CONFIRM_PAYMENT_ERROR",
        message: messages.bookings.messages.error.payment.confirmFailed,
        details: "",
        hint: "",
      },
    };
  }
}
