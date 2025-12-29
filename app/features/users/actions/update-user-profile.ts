"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { requireAuth } from "@/app/features/auth/lib/require-auth";
import messages from "@/lib/messages.json";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";
import {
  type UpdateUserProfileInput,
  updateUserProfileSchema,
} from "../lib/user.schema";

export async function updateUserProfile(data: UpdateUserProfileInput) {
  // 1. Verify authentication and get Supabase client (ALWAYS first)
  const { user, supabase, error: authError } = await requireAuth();
  if (authError || !supabase || !user) {
    return {
      data: null,
      error: authError || {
        code: "UNAUTHENTICATED",
        message: "You must be logged in to update your profile",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  // 2. Validate input
  const validationResult = updateUserProfileSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  // 3. Check if there's anything to update
  const validatedData = validationResult.data;
  if (!validatedData.user_company_name) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: messages.users.messages.error.update.noFields,
        details: "",
        hint: "",
        name: "ValidationError",
      },
    };
  }

  // 4. Perform database operation
  const result = await supabase
    .from("users")
    .update({ user_company_name: validatedData.user_company_name })
    .eq("user_id", user.id)
    .select()
    .single();

  // 5. Handle database errors
  if (result.error) {
    return {
      data: null,
      error: result.error,
    };
  }

  // 6. Handle not found case
  if (!result.data) {
    const notFoundError: PostgrestError = {
      code: "PGRST116",
      message: messages.users.messages.error.update.notFound,
      details: "",
      hint: "",
    } as PostgrestError;
    return { data: null, error: notFoundError };
  }

  return toSupabaseMutationResponse<Tables<"users">>(result);
}
