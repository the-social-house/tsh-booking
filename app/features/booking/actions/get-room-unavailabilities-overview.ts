"use server";

import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

/**
 * Get all room unavailabilities for the booking overview
 * Returns unavailabilities that are active (today or future)
 */
export async function getRoomUnavailabilitiesOverview() {
  const supabase = await createClient();
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10); // YYYY-MM-DD

  // Get all unavailabilities that end on or after today
  // (unavailabilities that are still active or upcoming)
  const result = await supabase
    .from("room_unavailabilities")
    .select("*")
    .gte("unavailable_end_date", todayIso)
    .order("unavailable_start_date")
    .order("meeting_room_id");

  return toSupabaseQueryResponse<Tables<"room_unavailabilities">[]>(result);
}
