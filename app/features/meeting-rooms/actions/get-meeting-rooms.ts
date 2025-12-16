"use server";

import { supabase } from "@/lib/supabase";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

export type MeetingRoom = Tables<"meeting_rooms">;

export async function getMeetingRooms() {
  const result = await supabase.from("meeting_rooms").select();

  return toSupabaseQueryResponse<MeetingRoom[]>(result);
}
