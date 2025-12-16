"use server";

import { supabase } from "@/lib/supabase";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";
import { getMeetingRoomSchema } from "../lib/meeting-room.schema";

export type MeetingRoom = Tables<"meeting_rooms">;

/**
 * Fetches a single meeting room by name.
 * Normalizes the room name from URL format (e.g., "room-of-innovation")
 * to database format (e.g., "Room of Innovation").
 *
 * @param roomName - Room name in URL format (kebab-case) or database format
 * @returns Meeting room data or error
 */
export async function getMeetingRoom(roomName: string) {
  // Validate input
  const validationResult = getMeetingRoomSchema.safeParse({ roomName });

  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  // Normalize room name: convert URL format to database format
  // "room-of-innovation" -> "Room of Innovation"
  const normalizedName = normalizeRoomName(validationResult.data.roomName);

  // Query database (case-insensitive search)
  // Use ilike for case-insensitive matching since normalization may not match exactly
  const result = await supabase
    .from("meeting_rooms")
    .select("*")
    .ilike("meeting_room_name", normalizedName)
    .single();

  return toSupabaseQueryResponse<MeetingRoom>(result);
}

/**
 * Normalizes room name from URL format to database format.
 * Example: "room-of-innovation" -> "Room of Innovation"
 * Handles articles/prepositions (of, the, etc.) as lowercase.
 */
function normalizeRoomName(urlName: string): string {
  // Words that should remain lowercase (articles, prepositions)
  const lowercaseWords = new Set(["of", "the", "a", "an", "and", "or", "but"]);

  return urlName
    .split("-")
    .map((word, index) => {
      // First word is always capitalized
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Articles/prepositions remain lowercase
      if (lowercaseWords.has(word.toLowerCase())) {
        return word.toLowerCase();
      }
      // Other words are capitalized
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
