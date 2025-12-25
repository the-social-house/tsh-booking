"use server";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<{
  user: User | null;
  error: null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return {
      user: null,
      error: null, // Return null user on error, don't expose error details
    };
  }

  return {
    user,
    error: null,
  };
}
