"use server";

import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

export type MeetingRoom = Tables<"meeting_rooms"> & {
  unavailabilities?: Tables<"room_unavailabilities">[];
  amenities?: Array<{
    amenity_id: string;
    amenities: Tables<"amenities"> | null;
  }>;
};

export async function getMeetingRooms() {
  const supabase = await createClient();

  const result = await supabase
    .from("meeting_rooms")
    .select(`
      *,
      unavailabilities:room_unavailabilities(*),
      amenities:meeting_room_amenities(
        amenities(*)
      )
    `)
    .order("meeting_room_name", { ascending: true });

  return toSupabaseQueryResponse<MeetingRoom[]>(
    result as Parameters<typeof toSupabaseQueryResponse<MeetingRoom[]>>[0]
  );
}
