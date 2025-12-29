"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/supabase/types/database";

type IsAdminOptions = {
  supabase?: SupabaseClient<Database>;
  user?: User;
};

/**
 * Check if current user (or provided user) has admin role.
 * Optionally accepts a Supabase client to reuse existing connection.
 */
export async function isAdmin(options?: IsAdminOptions): Promise<boolean> {
  const supabase = options?.supabase ?? (await createClient());

  // Use provided user or get current authenticated user
  let userId = options?.user?.id;

  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }
    userId = user.id;
  }

  // Check if user has admin role
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      user_id,
      roles (
        role_name
      )
    `
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return false;
  }

  const role = data.roles as { role_name: string } | null;
  return role?.role_name === "admin";
}
