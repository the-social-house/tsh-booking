"use server";

import { requireAuth } from "@/app/features/auth/lib/require-auth";
import { createValidationError } from "@/lib/validation";
import {
  type UpdateUserPasswordInput,
  updateUserPasswordSchema,
} from "../lib/user.schema";

export async function updateUserPassword(data: UpdateUserPasswordInput) {
  // 1. Verify authentication and get Supabase client (ALWAYS first)
  const { supabase, error: authError } = await requireAuth();
  if (authError || !supabase) {
    return {
      success: false,
      error: authError || {
        code: "UNAUTHENTICATED",
        message: "You must be logged in to update your password",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // 2. Validate input
  const validationResult = updateUserPasswordSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      error: createValidationError(validationResult.error),
    };
  }

  // 3. Update password in auth.users
  const { error } = await supabase.auth.updateUser({
    password: validationResult.data.password,
  });

  if (error) {
    return {
      success: false,
      error: {
        code: error.status?.toString() || "AUTH_ERROR",
        message: error.message,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  return {
    success: true,
    error: null,
  };
}
