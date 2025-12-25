"use server";

import { z } from "zod";
import { requireAuth } from "@/app/features/auth/lib/require-auth";
import messages from "@/lib/messages.json";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

const createBookingAmenitiesSchema = z.object({
  booking_id: z.string().uuid(),
  amenity_ids: z.array(z.string().uuid()).min(1),
});

export type CreateBookingAmenitiesInput = z.infer<
  typeof createBookingAmenitiesSchema
>;

export async function createBookingAmenities(
  data: CreateBookingAmenitiesInput
) {
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

  // Validate input
  const validationResult = createBookingAmenitiesSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  const { booking_id, amenity_ids } = validationResult.data;

  // Create booking_amenities entries
  const entries = amenity_ids.map((amenity_id) => ({
    booking_id,
    amenity_id,
  }));

  const result = await supabase
    .from("booking_amenities")
    .insert(entries)
    .select();

  if (result.error) {
    // Return user-friendly error message
    return {
      data: null,
      error: {
        ...result.error,
        message: messages.bookings.messages.error.amenities.addFailed,
        details: "",
        hint: "",
      },
    };
  }

  return toSupabaseMutationResponse<typeof result.data>(result);
}
