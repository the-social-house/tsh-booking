"use server";

import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

/**
 * Fetches all roles (admin only)
 * Used for dropdowns in admin forms
 */
export async function getAllRoles() {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      data: null,
      error: authError,
    };
  }

  const supabase = await createClient();

  const result = await supabase
    .from("roles")
    .select("*")
    .order("role_name", { ascending: true });

  return toSupabaseQueryResponse<Tables<"roles">[]>(result);
}
