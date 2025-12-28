"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import {
  amenityIdSchema,
  type UpdateAmenityInput,
  updateAmenitySchema,
} from "@/app/features/admin/lib/amenity.schema";
import { getUpdateAmenityErrorMessage } from "@/app/features/admin/lib/error-messages";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";

/**
 * Update an amenity by ID
 */
export async function updateAmenity(id: string, data: UpdateAmenityInput) {
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

  // 1. Validate ID
  const idValidation = amenityIdSchema.safeParse({ id });
  if (!idValidation.success) {
    return {
      data: null,
      error: createValidationError(idValidation.error),
    };
  }

  // 2. Validate update data
  const dataValidation = updateAmenitySchema.safeParse(data);
  if (!dataValidation.success) {
    return {
      data: null,
      error: createValidationError(dataValidation.error),
    };
  }

  // 3. Perform database operation with validated data
  const validatedData = dataValidation.data;

  const result = await supabaseAdmin
    .from("amenities")
    .update(validatedData)
    .eq("amenity_id", id)
    .select()
    .single();

  // 4. Handle database errors
  if (result.error) {
    const errorMessage = getUpdateAmenityErrorMessage(result.error.code);
    return {
      data: null,
      error: { ...result.error, message: errorMessage },
    };
  }

  // 5. Handle not found case
  if (!result.data) {
    const notFoundError: PostgrestError = {
      code: "PGRST116",
      message: messages.amenities.messages.error.update.notFound,
      details: "",
      hint: "",
    } as PostgrestError;

    return { data: null, error: notFoundError };
  }

  return toSupabaseMutationResponse<Tables<"amenities">>(result);
}
