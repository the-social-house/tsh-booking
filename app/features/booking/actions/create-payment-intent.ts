"use server";

import { stripe } from "@/lib/stripe";
import type { SupabaseResponse } from "@/lib/supabase-response";

export type CreatePaymentIntentInput = {
  /**
   * Amount in DKK (will be converted to øre for Stripe)
   */
  amount: number;
  /**
   * User ID for metadata
   */
  userId: number;
  /**
   * Meeting room ID for metadata
   */
  roomId: number;
  /**
   * Booking date for metadata
   */
  bookingDate: string;
  /**
   * Optional booking ID if booking already created
   */
  bookingId?: number;
};

export type CreatePaymentIntentResult = {
  clientSecret: string;
  paymentIntentId: string;
};

/**
 * Create a Stripe PaymentIntent for a booking
 * Amount is in DKK and will be converted to øre (smallest currency unit)
 */
export async function createPaymentIntent(
  data: CreatePaymentIntentInput
): Promise<SupabaseResponse<CreatePaymentIntentResult>> {
  try {
    // Convert DKK to øre (1 DKK = 100 øre)
    const amountInOre = Math.round(data.amount * 100);

    if (amountInOre < 50) {
      // Stripe minimum is 50 øre (0.50 DKK)
      return {
        data: null,
        error: {
          name: "PostgrestError",
          code: "INVALID_AMOUNT",
          message: "Payment amount must be at least 0.50 DKK",
          details: "",
          hint: "",
        },
      };
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInOre,
      currency: "dkk",
      metadata: {
        userId: data.userId.toString(),
        roomId: data.roomId.toString(),
        bookingDate: data.bookingDate,
        ...(data.bookingId && { bookingId: data.bookingId.toString() }),
      },
      // Allow payment methods
      payment_method_types: ["card"],
      // Automatically capture payment
      capture_method: "automatic",
    });

    // Ensure client_secret exists
    if (!paymentIntent.client_secret) {
      return {
        data: null,
        error: {
          name: "PostgrestError",
          code: "STRIPE_ERROR",
          message: "Payment intent created but no client secret returned",
          details: "",
          hint: "",
        },
      };
    }

    return {
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        name: "PostgrestError",
        code: "STRIPE_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create payment intent",
        details: error instanceof Error ? error.stack || "" : String(error),
        hint: "",
      },
    };
  }
}
