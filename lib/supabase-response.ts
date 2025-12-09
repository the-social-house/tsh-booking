import type { PostgrestError, PostgrestResponse } from "@supabase/supabase-js";

/**
 * Standard response type for Supabase queries and mutations with .select()
 * T is the data type returned on success
 */
export type SupabaseResponse<T> =
  | { data: T; error: null }
  | { data: null; error: PostgrestError };

/**
 * Response type for mutations without .select() (success/failure only)
 */
export type SupabaseMutationResult =
  | { success: true }
  | { success: false; error: PostgrestError };

/**
 * Transform Supabase QUERY result (GET operations) into a consistent response format
 *
 * Use this for SELECT queries that always return data (or error).
 *
 * @example
 * const result = await supabase.from('amenities').select();
 * const response = toSupabaseQueryResponse(result);
 */
export function toSupabaseQueryResponse<T>(
  result:
    | PostgrestResponse<T>
    | { data: T | null; error: PostgrestError | null }
): SupabaseResponse<T> {
  const error = "error" in result ? result.error : null;
  const data = "data" in result ? result.data : null;

  if (error) {
    return { data: null, error };
  }

  return { data: data as T, error: null };
}

/**
 * Transform Supabase MUTATION result (CREATE/UPDATE/DELETE with .select()) into a consistent response format
 *
 * Use this for INSERT/UPDATE/DELETE operations that use `.select()` to return the affected record(s).
 *
 * @example
 * // ✅ Correct usage - with .select()
 * const result = await supabase.from('amenities').insert(data).select().single();
 * const response = toSupabaseMutationResponse(result); // response.data contains inserted record
 */
export function toSupabaseMutationResponse<T>(
  result:
    | PostgrestResponse<T>
    | { data: T | null; error: PostgrestError | null }
): SupabaseResponse<T> {
  const error = "error" in result ? result.error : null;
  const data = "data" in result ? result.data : null;

  if (error) {
    return { data: null, error };
  }

  // With .select(), data should always be present on success
  if (!data) {
    // This shouldn't happen if .select() is used, but handle it gracefully
    const mutationError: PostgrestError = {
      code: "PGRST116",
      message: "No data returned from mutation",
      details: "",
      hint: "",
    } as PostgrestError;
    return { data: null, error: mutationError };
  }

  return { data: data as T, error: null };
}

/**
 * Transform Supabase MUTATION result (CREATE/UPDATE/DELETE without .select()) into success/failure format
 *
 * Use this for INSERT/UPDATE/DELETE operations that don't use `.select()`.
 * Returns simple success/failure without data.
 *
 * @example
 * // For mutations without .select()
 * const result = await supabase.from('amenities').insert(data);
 * const response = toSupabaseMutationResult(result); // { success: true } or { success: false, error }
 */
export function toSupabaseMutationResult(
  result:
    | PostgrestResponse<never>
    | { data: unknown; error: PostgrestError | null }
): SupabaseMutationResult {
  const error = "error" in result ? result.error : null;

  if (error) {
    return { success: false, error };
  }

  return { success: true };
}

/**
 * @deprecated Use `toSupabaseQueryResponse` for queries or `toSupabaseMutationResponse` for mutations with .select()
 *
 * Generic helper that works for both queries and mutations.
 * For better type safety and clarity, use the specific helpers instead.
 */
export function toSupabaseResponse<T>(
  result:
    | PostgrestResponse<T>
    | { data: T | null; error: PostgrestError | null }
): SupabaseResponse<T> {
  return toSupabaseQueryResponse(result);
}

/**
 * Type guard to check if response has data
 */
export function hasData<T>(
  response: SupabaseResponse<T>
): response is { data: T; error: null } {
  return response.error === null && response.data !== null;
}

/**
 * Type guard to check if response has error
 */
export function hasError<T>(
  response: SupabaseResponse<T>
): response is { data: null; error: PostgrestError } {
  return response.error !== null;
}
