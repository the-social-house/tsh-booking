"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createValidationError } from "@/lib/validation";
import { type SignInInput, signInSchema } from "../lib/auth.schema";

export async function signIn(data: SignInInput) {
  // Validate input
  const validationResult = signInSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      error: createValidationError(validationResult.error),
    };
  }

  const supabase = await createClient();

  // Sign in with email and password
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: validationResult.data.email,
    password: validationResult.data.password,
  });

  if (error) {
    return {
      error: {
        code: error.status?.toString() || "AUTH_ERROR",
        message: error.message,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  if (authData.user) {
    // Redirect to home page on successful sign in
    redirect("/");
  }

  return {
    error: null,
  };
}
