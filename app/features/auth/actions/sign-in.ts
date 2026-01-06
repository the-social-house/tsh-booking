"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
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
    // Check user status before allowing login
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("user_status")
      .eq("user_id", authData.user.id)
      .single();

    if (userError || !userData) {
      // User doesn't exist in public.users - sign them out
      await supabase.auth.signOut();
      return {
        error: {
          code: "USER_NOT_FOUND",
          message: "User account not found. Please contact support.",
          details: "",
          hint: "",
          name: "AuthError",
        },
      };
    }

    if (userData.user_status !== "active") {
      // User is not active - sign them out
      await supabase.auth.signOut();
      return {
        error: {
          code: "USER_NOT_ACTIVE",
          message:
            userData.user_status === "pending"
              ? "Your account is pending activation. Please complete your signup or wait for payment confirmation."
              : "Your account is not active. Please contact support.",
          details: "",
          hint: "",
          name: "AuthError",
        },
      };
    }

    // Redirect to home page on successful sign in
    redirect("/");
  }

  return {
    error: null,
  };
}
