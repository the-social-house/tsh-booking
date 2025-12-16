"use server";

import { z } from "zod";
import messages from "@/lib/messages.json";
import { supabase } from "@/lib/supabase";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

const createBookingAmenitiesSchema = z.object({
  booking_id: z
    .number()
    .int(messages.bookings.validation.id.integer)
    .positive(messages.bookings.validation.id.positive),
  amenity_ids: z.array(z.number().int().positive()).min(1),
});

export type CreateBookingAmenitiesInput = z.infer<
  typeof createBookingAmenitiesSchema
>;

export async function createBookingAmenities(
  data: CreateBookingAmenitiesInput
) {
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
    return {
      data: null,
      error: result.error,
    };
  }

  return toSupabaseMutationResponse<typeof result.data>(result);
}
