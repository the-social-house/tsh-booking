"use server";

import { isAdmin } from "@/app/features/auth/actions/is-admin";
import messages from "@/lib/messages.json";
import { type AuthResult, requireAuth } from "./require-auth";

/**
 * Requires authentication AND admin role for server actions.
 * Returns the authenticated user AND the Supabase client for reuse.
 */
export async function requireAdmin(): Promise<AuthResult> {
  // First verify authentication (creates one client)
  const authResult = await requireAuth();
  if (authResult.error || !authResult.user || !authResult.supabase) {
    return {
      user: null,
      supabase: null,
      error: authResult.error || {
        code: "UNAUTHENTICATED",
        message: messages.common.messages.pleaseLogIn,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // Verify admin role (reuses the same client!)
  const admin = await isAdmin({
    supabase: authResult.supabase,
    user: authResult.user,
  });

  if (!admin) {
    return {
      user: null,
      supabase: null,
      error: {
        code: "FORBIDDEN",
        message: messages.common.messages.adminRequired,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  return {
    user: authResult.user,
    supabase: authResult.supabase,
    error: null,
  };
}
