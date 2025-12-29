"use server";

import { requireAuth } from "@/app/features/auth/lib/require-auth";
import { createValidationError } from "@/lib/validation";
import {
  type UpdateUserEmailInput,
  updateUserEmailSchema,
} from "../lib/user.schema";

export async function updateUserEmail(data: UpdateUserEmailInput) {
  // 1. Verify authentication and get Supabase client (ALWAYS first)
  const { user, supabase, error: authError } = await requireAuth();
  if (authError || !supabase || !user) {
    return {
      data: null,
      error: authError || {
        code: "UNAUTHENTICATED",
        message: "You must be logged in to update your email",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // 2. Validate input
  const validationResult = updateUserEmailSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  // 3. Update email in auth.users
  const { data: authData, error: authUpdateError } =
    await supabase.auth.updateUser({
      email: validationResult.data.email,
    });

  if (authUpdateError) {
    return {
      data: null,
      error: {
        code: authUpdateError.status?.toString() || "AUTH_ERROR",
        message: authUpdateError.message,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // 4. Sync email to public.users table
  const { error: dbError } = await supabase
    .from("users")
    .update({ user_email: validationResult.data.email })
    .eq("user_id", user.id);

  if (dbError) {
    return {
      data: null,
      error: dbError,
    };
  }

  return {
    data: authData.user,
    error: null,
  };
}
