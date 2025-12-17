"use server";

import { z } from "zod";
import messages from "@/lib/messages.json";
import { supabase } from "@/lib/supabase";
import { toSupabaseMutationResult } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";

const updateMeetingRoomAmenitiesSchema = z.object({
  meeting_room_id: z
    .number()
    .int(messages.admin.meetingRooms.validation.id.integer)
    .positive(messages.admin.meetingRooms.validation.id.positive),
  amenity_ids: z.array(z.number().int().positive()).default([]),
});

export type UpdateMeetingRoomAmenitiesInput = z.infer<
  typeof updateMeetingRoomAmenitiesSchema
>;

/**
 * Replace amenities associated with a meeting room.
 *
 * This will remove all existing meeting_room_amenities rows for the room
 * and insert the provided amenity_ids (if any).
 */
export async function updateMeetingRoomAmenities(
  data: UpdateMeetingRoomAmenitiesInput
) {
  const validationResult = updateMeetingRoomAmenitiesSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      error: createValidationError(validationResult.error),
    };
  }

  const { meeting_room_id, amenity_ids } = validationResult.data;

  // 1. Delete existing links
  const deleteResult = await supabase
    .from("meeting_room_amenities")
    .delete()
    .eq("meeting_room_id", meeting_room_id);

  if (deleteResult.error) {
    return {
      success: false,
      error: deleteResult.error,
    };
  }

  // 2. Insert new links if any amenities are provided
  if (amenity_ids.length === 0) {
    return toSupabaseMutationResult(deleteResult);
  }

  const entries = amenity_ids.map((amenity_id) => ({
    meeting_room_id,
    amenity_id,
  }));

  const insertResult = await supabase
    .from("meeting_room_amenities")
    .insert(entries);

  return toSupabaseMutationResult(insertResult);
}
