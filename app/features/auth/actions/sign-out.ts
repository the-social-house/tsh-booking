"use server";

import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

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

  // Return success - let client handle redirect
  // (redirect() throws an error that gets caught by try/catch in client)
  return { success: true, error: null };
}
