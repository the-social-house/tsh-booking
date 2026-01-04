"use server";

import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";
import { getMeetingRoomSchema } from "../lib/meeting-room.schema";

export type MeetingRoom = Tables<"meeting_rooms">;

/**
 * Fetches a single meeting room by slug.
 *
 * @param roomSlug - Room slug in URL format (e.g., "room-of-innovation")
 * @returns Meeting room data or error
 */
export async function getMeetingRoom(roomSlug: string) {
  // Validate input
  const validationResult = getMeetingRoomSchema.safeParse({
    roomName: roomSlug,
  });

  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  const supabase = await createClient();

  // Query database by slug
  const result = await supabase
    .from("meeting_rooms")
    .select("*")
    .eq("meeting_room_slug", roomSlug)
    .single();

  return toSupabaseQueryResponse<MeetingRoom>(result);
}
