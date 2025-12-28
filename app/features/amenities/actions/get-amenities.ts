"use server";

import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

export type AdminAmenity = Tables<"amenities">;

export async function getAmenities() {
  const supabase = await createClient();

  const result = await supabase.from("amenities").select();

  return toSupabaseQueryResponse<AdminAmenity[]>(result);
}
