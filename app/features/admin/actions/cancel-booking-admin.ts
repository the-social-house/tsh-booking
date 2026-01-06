"use server";

import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { cancelBooking } from "@/app/features/booking/actions/cancel-booking";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

/**
 * Cancel a booking (admin only)
 * Wraps the regular cancelBooking action with admin authorization
 */
export async function cancelBookingAdmin(
  bookingId: string
): Promise<SupabaseResponse<Tables<"bookings">>> {
  // Verify admin access
  const adminResult = await requireAdmin();
  if (adminResult.error || !adminResult.user) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: messages.common.messages.adminRequired,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // Call the regular cancel booking action
  return cancelBooking(bookingId);
}
