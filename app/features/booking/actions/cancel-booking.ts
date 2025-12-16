"use server";

import { supabase } from "@/lib/supabase";
import type { SupabaseResponse } from "@/lib/supabase-response";

/**
 * Cancel a pending booking (typically used when payment is cancelled)
 * Sets payment_status to "cancelled" instead of deleting to maintain audit trail
 */
export async function cancelBooking(
  bookingId: number
): Promise<SupabaseResponse<{ success: boolean }>> {
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
        code: result.error.code,
        message: "Failed to cancel booking",
        details: result.error.message || "",
        hint: "",
      },
    };
  }

  return {
    data: { success: true },
    error: null,
  };
}
