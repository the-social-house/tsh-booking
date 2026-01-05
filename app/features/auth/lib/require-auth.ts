"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import messages from "@/lib/messages.json";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/supabase/types/database";

export type AuthError = {
  code: string;
  message: string;
  details: string;
  hint: string;
  name: string;
};

export type AuthResult = {
  user: User | null;
  supabase: SupabaseClient<Database> | null;
  error: AuthError | null;
};

/**
 * Requires authentication for server actions.
 * Returns the authenticated user AND the Supabase client for reuse.
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      supabase: null,
      error: {
        code: "UNAUTHENTICATED",
        message: messages.common.messages.pleaseLogIn,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  const { data: activeUser, error: activeUserError } = await supabase
    .from("users")
    .select("user_id, user_status")
    .eq("user_id", user.id)
    .single();

  if (activeUserError || !activeUser) {
    return {
      user: null,
      supabase: null,
      error: {
        code: "USER_NOT_ACTIVE",
        message: messages.common.messages.userNotFound,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  if (activeUser.user_status !== "active") {
    return {
      user: null,
      supabase: null,
      error: {
        code: "USER_NOT_ACTIVE",
        message: messages.common.messages.userNotActive,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  return {
    user,
    supabase,
    error: null,
  };
}
