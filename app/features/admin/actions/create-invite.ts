"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { getCreateInviteErrorMessage } from "@/app/features/admin/lib/error-messages";
import {
  type CreateInviteInput,
  createInviteSchema,
} from "@/app/features/admin/lib/invite.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables, TablesInsert } from "@/supabase/types/database";

/**
 * Check if a pending invite already exists for the email
 */
async function checkExistingInvite(
  email: string
): Promise<{ error: PostgrestError | null }> {
  const { data: existingInvite, error: checkError } = await supabaseAdmin
    .from("invites")
    .select("invite_id, invite_status")
    .eq("invite_email", email)
    .eq("invite_status", "pending")
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 means no rows found, which is fine
    return {
      error: {
        code: checkError.code || "DATABASE_ERROR",
        message: "Failed to check for existing invites",
        details: checkError.details || "",
        hint: checkError.hint || "",
        name: "PostgrestError",
      },
    };
  }

  if (existingInvite) {
    return {
      error: {
        code: "DUPLICATE_INVITE",
        message:
          messages.admin.ui.tabs.users.invite.messages.error.create
            .DUPLICATE_INVITE,
        details: "",
        hint: "",
        name: "ValidationError",
      } as PostgrestError,
    };
  }

  return { error: null };
}

/**
 * Handle invite error and return appropriate error response
 */
function handleInviteError(
  inviteError: { message?: string; status?: number } | null
): PostgrestError {
  if (!inviteError) {
    return {
      code: "AUTH_ERROR",
      message: "Failed to create invite. Please try again.",
      details: "",
      hint: "",
      name: "AuthError",
    };
  }

  // Handle duplicate user error
  if (
    inviteError.message?.includes("already registered") ||
    inviteError.message?.includes("already exists")
  ) {
    return {
      code: "USER_ALREADY_EXISTS",
      message: "A user with this email already exists.",
      details: "",
      hint: "",
      name: "ValidationError",
    };
  }

  // Use AUTH_ERROR code instead of HTTP status codes for consistent error mapping
  return {
    code: "AUTH_ERROR",
    message:
      inviteError.message || "Failed to create invite. Please try again.",
    details: "",
    hint: "",
    name: "AuthError",
  };
}

/**
 * Creates a new user invite using Supabase Auth
 * - Validates admin access
 * - Validates input data
 * - Creates user in auth.users (invited state) via inviteUserByEmail
 * - Creates invite record in database with metadata
 * - Supabase automatically sends invite email with encrypted link
 */
export async function createInvite(data: CreateInviteInput) {
  // 1. Verify admin access (ALWAYS first)
  const { error: authError } = await requireAdmin();
  if (authError) {
    return { data: null, error: authError };
  }

  // 2. Validate input with Zod
  const validationResult = createInviteSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  const { email, companyName, subscriptionId, roleId } = validationResult.data;

  // 3. Check if there's already a pending invite for this email
  const { error: existingInviteError } = await checkExistingInvite(email);
  if (existingInviteError) {
    return { data: null, error: existingInviteError };
  }

  // 4. Get base URL for redirect
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://127.0.0.1:3000";
  const redirectTo = `${baseUrl}/auth/complete-signup`;

  // 5. Create user in auth.users (invited state) and send email via Supabase
  const { data: authData, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        company_name: companyName,
        subscription_id: subscriptionId,
        role_id: roleId,
      },
    });

  if (inviteError) {
    const error = handleInviteError(inviteError);
    // Map error code to user-friendly message
    const errorMessage = getCreateInviteErrorMessage(error.code);
    return {
      data: null,
      error: { ...error, message: errorMessage },
    };
  }

  if (!authData?.user) {
    const error = handleInviteError(null);
    const errorMessage = getCreateInviteErrorMessage(error.code);
    return {
      data: null,
      error: { ...error, message: errorMessage },
    };
  }

  // Verify user exists in auth.users
  const { data: verifyUser, error: verifyError } =
    await supabaseAdmin.auth.admin.getUserById(authData.user.id);
  if (verifyError || !verifyUser) {
    return {
      data: null,
      error: {
        code: "USER_VERIFICATION_FAILED",
        message:
          "User was created but could not be verified. Please try again.",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // 6. Create invite record in database with metadata
  const result = await supabaseAdmin
    .from("invites")
    .insert({
      invite_auth_user_id: authData.user.id,
      invite_email: email,
      invite_company_name: companyName,
      invite_subscription_id: subscriptionId,
      invite_role_id: roleId,
      invite_status: "pending",
    } as unknown as TablesInsert<"invites">)
    .select()
    .single();

  // 7. Handle database errors with user-friendly messages
  if (result.error) {
    // Clean up: delete auth user if invite record creation fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

    const errorMessage = getCreateInviteErrorMessage(result.error.code);
    return {
      data: null,
      error: { ...result.error, message: errorMessage },
    };
  }

  return toSupabaseMutationResponse<Tables<"invites">>(result);
}
