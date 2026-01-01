"use server";

import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SupabaseResponse } from "@/lib/supabase-response";

/**
 * Bans or unbans a user by updating their auth metadata
 * Uses Supabase Admin API to update user's banned status
 */
export async function banUnbanUser(
  userId: string,
  banned: boolean
): Promise<SupabaseResponse<{ success: boolean }>> {
  // Verify admin access
  const { error: adminAuthError } = await requireAdmin();
  if (adminAuthError) {
    return {
      data: null,
      error: adminAuthError,
    };
  }

  // Update user's banned status using Supabase Admin API
  // Use ban_duration: 'none' to unban, or a long duration for permanent ban
  const updateData = banned
    ? { ban_duration: "876000h" } // Ban user permanently (100 years)
    : { ban_duration: "none" }; // Unban user

  const { error: updateAuthError } =
    await supabaseAdmin.auth.admin.updateUserById(userId, updateData);

  if (updateAuthError) {
    return {
      data: null,
      error: {
        code: updateAuthError.status?.toString() || "AUTH_ERROR",
        message: updateAuthError.message || "Failed to update user ban status",
        details: updateAuthError.message || "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // Also update the database column to keep it in sync
  const { error: dbError } = await supabaseAdmin
    .from("users")
    .update({ user_is_banned: banned })
    .eq("user_id", userId);

  if (dbError) {
    return {
      data: null,
      error: {
        code: dbError.code || "DATABASE_ERROR",
        message:
          dbError.message || "Failed to update user ban status in database",
        details: dbError.details || "",
        hint: dbError.hint || "",
        name: "PostgrestError",
      },
    };
  }

  return {
    data: { success: true },
    error: null,
  };
}
