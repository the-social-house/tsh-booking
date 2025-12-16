"use server";

import { supabase } from "@/lib/supabase";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";
import { getRoomAmenitiesSchema } from "../lib/meeting-room.schema";

export type RoomAmenity = Tables<"amenities">;

/**
 * Fetches all amenities associated with a meeting room.
 *
 * @param roomId - The meeting room ID
 * @returns Array of amenities with their details
 */
export async function getRoomAmenities(roomId: number) {
  // Validate input
  const validationResult = getRoomAmenitiesSchema.safeParse({ roomId });

  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  // Query with join to get full amenity details
  const result = await supabase
    .from("meeting_room_amenities")
    .select(
      `
      amenity_id,
      amenities (
        amenity_id,
        amenity_name,
        amenity_price
      )
    `
    )
    .eq("meeting_room_id", validationResult.data.roomId);

  // Use toSupabaseQueryResponse for consistent error handling
  const response =
    toSupabaseQueryResponse<
      Array<{
        amenity_id: number;
        amenities: RoomAmenity | null;
      }>
    >(result);

  // If there's an error, return it
  if (response.error) {
    return response;
  }

  // Transform the nested structure to flat array
  const amenities =
    response.data
      ?.map((item) => item.amenities)
      .filter((amenity): amenity is RoomAmenity => amenity !== null) ?? [];

  // Return transformed data using toSupabaseQueryResponse pattern
  return {
    data: amenities,
    error: null,
  };
}
