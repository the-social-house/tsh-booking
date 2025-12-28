"use server";

import {
  type CreateAmenityInput,
  createAmenitySchema,
} from "@/app/features/admin/lib/amenity.schema";
import { getCreateAmenityErrorMessage } from "@/app/features/admin/lib/error-messages";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables, TablesInsert } from "@/supabase/types/database";

function getFieldForDatabaseError(errorCode: string): string | null {
  const fieldMap: Record<string, string> = {
    // 23505 = unique violation - amenity_name is the only unique field
    "23505": "amenity_name",
  };
  return fieldMap[errorCode] ?? null;
}

/**
 * Create a new amenity
 */
export async function createAmenity(data: CreateAmenityInput) {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      data: null,
      error: authError || {
        code: "FORBIDDEN",
        message: messages.common.messages.adminRequired,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  const validationResult = createAmenitySchema.safeParse(data);

  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  const validatedData = validationResult.data;

  const result = await supabaseAdmin
    .from("amenities")
    .insert(validatedData as TablesInsert<"amenities">)
    .select()
    .single();

  if (result.error) {
    const errorMessage = getCreateAmenityErrorMessage(result.error.code);
    const errorField = getFieldForDatabaseError(result.error.code);

    const details = errorField
      ? JSON.stringify([{ path: [errorField], message: errorMessage }])
      : result.error.details;

    return {
      data: null,
      error: { ...result.error, message: errorMessage, details },
    };
  }

  return toSupabaseMutationResponse<Tables<"amenities">>(result);
}
