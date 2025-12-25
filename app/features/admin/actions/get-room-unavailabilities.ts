"use server";

import { supabase } from "@/lib/supabase";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

/**
 * Get all unavailabilities for a meeting room
 */
export async function getRoomUnavailabilities(meetingRoomId: number) {
  const result = await supabase
    .from("room_unavailabilities")
    .select()
    .eq("meeting_room_id", meetingRoomId)
    .order("unavailable_start_date", { ascending: true });

  return toSupabaseQueryResponse<Tables<"room_unavailabilities">[]>(result);
}
