import type { PostgrestError } from "@supabase/supabase-js";
import type React from "react";

/**
 * Generic form state for use with useActionState
 * @template T - Field errors type (e.g., { field_name?: boolean })
 */
export type FormState<
  T extends Record<string, boolean> = Record<string, boolean>,
> = {
  error: string | null;
  fieldErrors?: T;
  success: boolean;
};

/**
 * Parse Zod validation error details into field-specific errors
 */
export function parseFieldErrors<T extends Record<string, boolean>>(
  details: string | undefined
): T {
  if (!details) {
    return {} as T;
  }

  try {
    const issues = JSON.parse(details) as Array<{ path: string[] }>;
    const fieldErrors: Record<string, boolean> = {};
    for (const issue of issues) {
      const field = issue.path[0];
      if (field) {
        fieldErrors[field] = true;
      }
    }
    return fieldErrors as T;
  } catch {
    return {} as T;
  }
}

/**
 * Format error message for toast display
 * - Single error: returns plain text
 * - Multiple errors: returns bulleted list
 */
export function formatErrorForToast(
  error: PostgrestError | { message: string }
): React.ReactNode {
  const errors = error.message.split(". ").filter(Boolean);

  if (errors.length === 1) {
    return errors[0];
  }

  return (
    <ul className="list-disc pl-4">
      {errors.map((err) => (
        <li key={err}>{err}</li>
      ))}
    </ul>
  );
}
