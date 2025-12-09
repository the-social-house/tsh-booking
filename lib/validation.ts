import type { z } from "zod";

/**
 * Format Zod validation errors into a user-friendly message
 */
export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(". ");
}

/**
 * Create a validation error response compatible with PostgrestError
 */
export function createValidationError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: formatZodErrors(error),
    details: JSON.stringify(error.issues),
    hint: "",
    name: "ValidationError",
  };
}
