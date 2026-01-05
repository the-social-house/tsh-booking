"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SupabaseResponse } from "@/lib/supabase-response";

export type InviteTokenData = {
  email: string;
  companyName: string;
  subscriptionId: string;
  roleId: string;
  authUserId: string;
};

/**
 * Validates the current Supabase auth session and returns invite data
 * - Verifies user is authenticated via Supabase auth
 * - Checks if invite exists in database for this auth user
 * - Checks if invite is still pending
 * - Returns invite data if valid
 */
export async function validateInviteToken(): Promise<
  SupabaseResponse<InviteTokenData>
> {
  // 1. Get current Supabase auth session
  const supabase = await createClient();

  // First, try to get the session to ensure it's established
  await supabase.auth.getSession();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      data: null,
      error: {
        code: "UNAUTHENTICATED",
        message: "Invalid or expired invite link. Please request a new invite.",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // 2. Verify invite exists in database for this auth user
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from("invites")
    .select(
      "invite_id, invite_status, invite_email, invite_company_name, invite_subscription_id, invite_role_id"
    )
    .eq("invite_auth_user_id", user.id)
    .single();

  if (inviteError || !invite) {
    return {
      data: null,
      error: {
        code: "INVITE_NOT_FOUND",
        message: "Invite not found. Please request a new invite.",
        details: "",
        hint: "",
        name: "PostgrestError",
      },
    };
  }

  // 3. Check if invite is still pending
  if (invite.invite_status !== "pending") {
    return {
      data: null,
      error: {
        code: "INVITE_ALREADY_USED",
        message:
          invite.invite_status === "completed"
            ? "This invite has already been used."
            : "This invite is no longer valid.",
        details: "",
        hint: "",
        name: "ValidationError",
      },
    };
  }

  // 4. Verify email matches (security check) - case-insensitive comparison
  if (
    !user.email ||
    invite.invite_email.toLowerCase() !== user.email.toLowerCase()
  ) {
    return {
      data: null,
      error: {
        code: "EMAIL_MISMATCH",
        message:
          "Email mismatch. Please use the invite link sent to your email.",
        details: "",
        hint: "",
        name: "ValidationError",
      },
    };
  }

  return {
    data: {
      email: invite.invite_email,
      companyName: invite.invite_company_name,
      subscriptionId: invite.invite_subscription_id,
      roleId: invite.invite_role_id,
      authUserId: user.id,
    },
    error: null,
  };
}
