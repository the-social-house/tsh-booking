"use server";

import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

/**
 * Fetches all subscriptions
 */
export async function getAllSubscriptions() {
  const supabase = await createClient();

  const result = await supabase
    .from("subscriptions")
    .select("*")
    .order("subscription_monthly_price", { ascending: true });

  return toSupabaseQueryResponse<Tables<"subscriptions">[]>(result);
}
