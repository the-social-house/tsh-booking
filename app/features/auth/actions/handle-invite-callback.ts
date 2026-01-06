"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseResponse } from "@/lib/supabase-response";
import type { InviteTokenData } from "./validate-invite-token";
import { validateInviteToken } from "./validate-invite-token";

/**
 * Handles the Supabase invite callback by establishing a session from tokens
 * and validating the invite. This is called from client-side after reading hash fragments.
 */
export async function handleInviteCallback(
  accessToken: string,
  refreshToken: string
): Promise<SupabaseResponse<InviteTokenData>> {
  // 1. Create server client
  const supabase = await createClient();

  // 2. Set session from tokens
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return {
      data: null,
      error: {
        code: "SESSION_ERROR",
        message: "Failed to establish session. Please try again.",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // 3. Validate the invite now that session is established
  return await validateInviteToken();
}
