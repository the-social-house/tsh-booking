"use server";

import { z } from "zod";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createValidationError } from "@/lib/validation";

/**
 * Schema for creating a new user (admin only)
 */
const createUserSchema = z.object({
  email: z.string().email("Invalid email address").trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(2, "Username must be at least 2 characters").trim(),
  roleId: z.string().uuid("Invalid role ID"),
  subscriptionId: z.string().uuid("Invalid subscription ID"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export async function createUser(data: CreateUserInput) {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      userId: null,
      error: authError,
    };
  }

  // Validate input
  const validationResult = createUserSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      userId: null,
      error: createValidationError(validationResult.error),
    };
  }

  const { email, password, username, roleId, subscriptionId } =
    validationResult.data;

  // Step 1: Create user in Supabase Auth (using admin client)
  const { data: authData, error: createAuthError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
    });

  if (createAuthError || !authData.user) {
    return {
      userId: null,
      error: {
        code: createAuthError?.status?.toString() || "AUTH_ERROR",
        message: createAuthError?.message || "Failed to create user",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  const userId = authData.user.id;

  // Step 2: Create corresponding entry in public.users table
  const { error: userError } = await supabaseAdmin
    .from("users")
    .insert({
      user_id: userId,
      user_email: email,
      user_username: username,
      user_role_id: roleId,
      user_subscription_id: subscriptionId,
      user_current_monthly_bookings: 0,
    })
    .select()
    .single();

  if (userError) {
    // If user creation in public.users fails, try to clean up auth user
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return {
      userId: null,
      error: {
        code: userError.code || "DATABASE_ERROR",
        message: userError.message,
        details: userError.details || "",
        hint: userError.hint || "",
        name: "PostgrestError",
      },
    };
  }

  return {
    userId,
    error: null,
  };
}
