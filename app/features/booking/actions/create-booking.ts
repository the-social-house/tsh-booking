"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import messages from "@/lib/messages.json";
import { supabase } from "@/lib/supabase";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";
import {
  type CreateBookingInput,
  createBookingSchema,
} from "../lib/booking.schema";
import { getCreateErrorMessage } from "../lib/error-messages";

export async function createBooking(data: CreateBookingInput) {
  // Log the incoming data
  console.log("📥 Booking data received:", JSON.stringify(data, null, 2));

  // 1. Validate input with Zod (ALWAYS first)
  const validationResult = createBookingSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  // 2. Use validated data for database operation
  const validatedData = validationResult.data;
  console.log(
    "✅ Validated booking data:",
    JSON.stringify(validatedData, null, 2)
  );

  // 3. Check user's subscription limit BEFORE creating booking
  // Use the user_id from the booking data (no session needed for now)
  const userId = validatedData.booking_user_id;

  // Fetch user data
  const userResult = await supabase
    .from("users")
    .select("user_current_monthly_bookings, user_subscription_id")
    .eq("user_id", userId)
    .single();

  if (userResult.error) {
    console.error(
      "❌ Error fetching user:",
      JSON.stringify(userResult.error, null, 2)
    );
    return {
      data: null,
      error: {
        ...userResult.error,
        message: "Unable to verify subscription limits. Please try again.",
      },
    };
  }

  if (!userResult.data) {
    const notFoundError: PostgrestError = {
      code: "PGRST116",
      message: "User not found",
      details: "",
      hint: "",
    } as PostgrestError;
    return {
      data: null,
      error: notFoundError,
    };
  }

  const currentBookings = userResult.data.user_current_monthly_bookings ?? 0;
  const subscriptionId = userResult.data.user_subscription_id;

  // Fetch subscription data
  const subscriptionResult = await supabase
    .from("subscriptions")
    .select("subscription_max_monthly_bookings")
    .eq("subscription_id", subscriptionId)
    .single();

  if (subscriptionResult.error) {
    console.error(
      "❌ Error fetching subscription:",
      JSON.stringify(subscriptionResult.error, null, 2)
    );
    return {
      data: null,
      error: {
        ...subscriptionResult.error,
        message: "Unable to verify subscription limits. Please try again.",
      },
    };
  }

  const maxBookings =
    subscriptionResult.data?.subscription_max_monthly_bookings ?? null;

  // Check subscription limit (null means unlimited)
  if (maxBookings !== null && currentBookings >= maxBookings) {
    console.log(
      `❌ Subscription limit exceeded: ${currentBookings}/${maxBookings}`
    );
    const limitError: PostgrestError = {
      code: "SUBSCRIPTION_LIMIT_EXCEEDED",
      message:
        messages.bookings.messages.error.create.subscriptionLimitExceeded,
      details: "",
      hint: "",
    } as PostgrestError;
    return {
      data: null,
      error: limitError,
    };
  }

  console.log(
    `✅ Subscription check passed: ${currentBookings}/${maxBookings ?? "unlimited"}`
  );

  // 4. Create the booking
  const result = await supabase
    .from("bookings")
    .insert(validatedData)
    .select()
    .single();

  // 5. Handle database errors with user-friendly messages
  if (result.error) {
    console.error("❌ Database error:", JSON.stringify(result.error, null, 2));
    const errorMessage = getCreateErrorMessage(result.error.code);
    return {
      data: null,
      error: { ...result.error, message: errorMessage },
    };
  }

  // 6. Increment user's monthly bookings count (same server action, atomic operation)
  if (result.data) {
    const updateResult = await supabase
      .from("users")
      .update({
        user_current_monthly_bookings: currentBookings + 1,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateResult.error) {
      console.error(
        "⚠️ Booking created but failed to update user count:",
        JSON.stringify(updateResult.error, null, 2)
      );
      // Don't fail the booking creation, just log the error
      // In production, you might want to rollback or retry
    } else {
      console.log(
        `✅ User monthly bookings incremented: ${currentBookings + 1}`
      );
    }
  }

  console.log(
    "🎉 Booking created successfully:",
    JSON.stringify(result.data, null, 2)
  );
  return toSupabaseMutationResponse<Tables<"bookings">>(result);
}
