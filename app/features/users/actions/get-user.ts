"use server";

import type { PostgrestError, QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import { getUserByIdSchema } from "../lib/user.schema";

// Helper function to build the query (used for both type inference and execution)
async function buildUserQuery(userId: string) {
  const supabase = await createClient();
  return supabase
    .from("users")
    .select(
      `
      user_id,
      user_email,
      user_subscription_id,
      user_current_monthly_bookings,
      user_company_name,
      subscriptions (
        subscription_discount_rate
      )      
    `
    )
    .eq("user_id", userId)
    .single();
}

// Infer the nested query result type from the actual query
type UserWithNestedSubscription = QueryData<ReturnType<typeof buildUserQuery>>;

// Automatically flatten the nested type
export type UserWithSubscription = Omit<
  UserWithNestedSubscription,
  "subscriptions" | "user_current_monthly_bookings"
> & {
  user_current_monthly_bookings: number;
  subscription_discount_rate: number;
};

export async function getUser(userId: string) {
  // Validate input
  const validationResult = getUserByIdSchema.safeParse({ userId });

  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  // Query user with subscription join to get discount rate
  const userWithSubscriptionResult = await buildUserQuery(
    validationResult.data.userId
  );

  if (userWithSubscriptionResult.error) {
    return toSupabaseQueryResponse<UserWithSubscription>(
      userWithSubscriptionResult
    );
  }

  // Transform the nested structure to flat object
  if (!userWithSubscriptionResult.data) {
    const notFoundError: PostgrestError = {
      code: "PGRST116",
      message: "User not found", // This is a standard Supabase error code message
      details: "",
      hint: "",
      name: "PostgrestError",
    } as PostgrestError;
    return {
      data: null,
      error: notFoundError,
    };
  }

  const subscription = userWithSubscriptionResult.data.subscriptions as {
    subscription_discount_rate: number;
  } | null;

  const userData: UserWithSubscription = {
    user_id: userWithSubscriptionResult.data.user_id,
    user_email: userWithSubscriptionResult.data.user_email,
    user_subscription_id: userWithSubscriptionResult.data.user_subscription_id,
    user_current_monthly_bookings:
      userWithSubscriptionResult.data.user_current_monthly_bookings ?? 0,
    subscription_discount_rate: subscription?.subscription_discount_rate ?? 0,
    user_company_name: userWithSubscriptionResult.data.user_company_name,
  };

  return {
    data: userData,
    error: null,
  };
}
