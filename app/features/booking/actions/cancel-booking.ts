"use server";

import { requireAuth } from "@/app/features/auth/lib/require-auth";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";

/**
 * Cancel a pending booking (typically used when payment is cancelled)
 * Sets payment_status to "cancelled" instead of deleting to maintain audit trail
 */
export async function cancelBooking(
  bookingId: string
): Promise<SupabaseResponse<{ success: boolean }>> {
  // Verify authentication and get Supabase client
  const { supabase, error: authError } = await requireAuth();
  if (authError || !supabase) {
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

  const result = await supabase
    .from("bookings")
    .update({
      booking_payment_status: "cancelled",
    })
    .eq("booking_id", bookingId)
    .select()
    .single();

  if (result.error) {
    return {
      data: null,
      error: {
        name: "PostgrestError",
        code: result.error.code || "CANCEL_FAILED",
        message: messages.bookings.messages.error.cancel.failed,
        details: "",
        hint: "",
      },
    };
  }

  return {
    data: { success: true },
    error: null,
  };
}
