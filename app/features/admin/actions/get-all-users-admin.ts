"use server";

import type { QueryData } from "@supabase/supabase-js";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { createClient } from "@/lib/supabase/server";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";

// Base query used for type inference of the joined shape
async function buildAdminUserQuery() {
  const supabase = await createClient();
  return supabase
    .from("users")
    .select(
      `
      user_id,
      user_company_name,
      user_email,
      user_created_at,
      user_current_monthly_bookings,
      user_is_banned,
      subscriptions (
        subscription_id,
        subscription_name,
        subscription_monthly_price,
        subscription_max_monthly_bookings,
        subscription_discount_rate
      )
    `
    )
    .order("user_created_at", { ascending: false });
}

export type AdminUser = QueryData<
  ReturnType<typeof buildAdminUserQuery>
>[number];

/**
 * Fetches all users for admin view with subscription information and ban status
 */
export async function getAllUsers() {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      data: null,
      error: authError,
    };
  }

  const supabase = await createClient();

  const result = await supabase
    .from("users")
    .select(
      `
      user_id,
      user_company_name,
      user_email,
      user_created_at,
      user_current_monthly_bookings,
      user_is_banned,
      subscriptions (
        subscription_id,
        subscription_name,
        subscription_monthly_price,
        subscription_max_monthly_bookings,
        subscription_discount_rate
      )
    `
    )
    .order("user_created_at", { ascending: false });

  return toSupabaseQueryResponse<AdminUser[]>(result);
}
