"use server";

import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import type { SupabaseResponse } from "@/lib/supabase-response";

export type ConfirmPaymentInput = {
  /**
   * Payment Intent ID from Stripe
   */
  paymentIntentId: string;
  /**
   * Booking ID to update
   */
  bookingId: number;
};

/**
 * Confirm payment and update booking with Stripe transaction details
 */
export async function confirmPayment(
  data: ConfirmPaymentInput
): Promise<SupabaseResponse<{ success: boolean }>> {
  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      data.paymentIntentId
    );

    // Verify payment was successful
    if (paymentIntent.status !== "succeeded") {
      const errorMessage = `Payment status is "${paymentIntent.status}". Expected "succeeded". Payment Intent ID: ${data.paymentIntentId}`;
      return {
        data: null,
        error: {
          name: "PostgrestError",
          code: "PAYMENT_NOT_SUCCEEDED",
          message: errorMessage,
          details: JSON.stringify({
            status: paymentIntent.status,
            paymentIntentId: data.paymentIntentId,
            bookingId: data.bookingId,
          }),
          hint: "The payment may still be processing. Please check your Stripe dashboard.",
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
      return {
        data: null,
        error: {
          name: "PostgrestError",
          code: "UPDATE_FAILED",
          message: "Failed to update booking with payment information",
          details: updateResult.error.message || "",
          hint: `Booking ID: ${data.bookingId}, Payment Intent ID: ${data.paymentIntentId}`,
        },
      };
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        name: "PostgrestError",
        code: "CONFIRM_PAYMENT_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to confirm payment",
        details: error instanceof Error ? error.stack || "" : String(error),
        hint: `Payment Intent ID: ${data.paymentIntentId}, Booking ID: ${data.bookingId}`,
      },
    };
  }
}
