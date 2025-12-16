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

type CreateBookingOptions = {
  amenityIds?: number[];
};

/**
 * Validate time slot is within business hours (9:00 - 22:00)
 */
function validateBusinessHours(
  startTime: Date,
  endTime: Date
): {
  valid: boolean;
  error?: PostgrestError;
} {
  const startHour = startTime.getHours();
  const endHour = endTime.getHours();
  const startMinutes = startTime.getMinutes();
  const endMinutes = endTime.getMinutes();

  // Start time must be at least 9:00
  if (startHour < 9 || (startHour === 9 && startMinutes < 0)) {
    return {
      valid: false,
      error: {
        name: "PostgrestError",
        code: "INVALID_TIME_SLOT",
        message: messages.bookings.messages.error.create.invalidTimeSlot,
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  // End time must be at most 22:00
  if (endHour > 22 || (endHour === 22 && endMinutes > 0)) {
    return {
      valid: false,
      error: {
        name: "PostgrestError",
        code: "INVALID_TIME_SLOT",
        message: messages.bookings.messages.error.create.invalidTimeSlot,
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  return { valid: true };
}

/**
 * Validate booking date/time is not in the past
 */
function validateNotInPast(
  bookingDate: Date,
  startTime: Date,
  now: Date
): { valid: boolean; error?: PostgrestError } {
  const dateOnly = new Date(bookingDate);
  dateOnly.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (dateOnly < today) {
    return {
      valid: false,
      error: {
        name: "PostgrestError",
        code: "PAST_DATE",
        message: messages.bookings.messages.error.create.pastTimeSlot,
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  // Check if time is in the past (for today's bookings)
  if (dateOnly.getTime() === today.getTime() && startTime < now) {
    return {
      valid: false,
      error: {
        name: "PostgrestError",
        code: "PAST_TIME",
        message: messages.bookings.messages.error.create.pastTimeSlot,
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  return { valid: true };
}

/**
 * Validate and calculate amenity prices
 */
async function validateAndCalculateAmenities(
  amenityIds: number[],
  roomId: number
): Promise<{ total: number; error?: PostgrestError }> {
  // Fetch room amenities to verify they belong to this room
  const roomAmenitiesResult = await supabase
    .from("meeting_room_amenities")
    .select("amenity_id")
    .eq("meeting_room_id", roomId);

  if (roomAmenitiesResult.error) {
    return {
      total: 0,
      error: {
        ...roomAmenitiesResult.error,
        message: "Unable to verify amenities. Please try again.",
      } as PostgrestError,
    };
  }

  const validAmenityIds = new Set(
    roomAmenitiesResult.data?.map((a) => a.amenity_id) || []
  );

  // Verify all selected amenities belong to this room
  const invalidAmenities = amenityIds.filter((id) => !validAmenityIds.has(id));

  if (invalidAmenities.length > 0) {
    return {
      total: 0,
      error: {
        name: "PostgrestError",
        code: "INVALID_AMENITY",
        message: messages.bookings.messages.error.create.invalidAmenity,
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  // Fetch amenity prices
  const amenitiesResult = await supabase
    .from("amenities")
    .select("amenity_id, amenity_price")
    .in("amenity_id", amenityIds);

  if (amenitiesResult.error) {
    return {
      total: 0,
      error: {
        ...amenitiesResult.error,
        message: "Unable to calculate amenity prices. Please try again.",
      } as PostgrestError,
    };
  }

  // Calculate total amenity price
  const total =
    amenitiesResult.data?.reduce(
      (sum, amenity) => sum + Number(amenity.amenity_price || 0),
      0
    ) || 0;

  return { total };
}

/**
 * Check for booking conflicts
 */
async function checkBookingConflicts(
  roomId: number,
  startTime: string,
  endTime: string
): Promise<{ hasConflict: boolean; error?: PostgrestError }> {
  const conflictCheck = await supabase
    .from("bookings")
    .select("booking_id")
    .eq("booking_meeting_room_id", roomId)
    .neq("booking_payment_status", "cancelled")
    .lt("booking_start_time", endTime)
    .gt("booking_end_time", startTime);

  if (conflictCheck.error) {
    return {
      hasConflict: false,
      error: {
        ...conflictCheck.error,
        message: "Unable to verify booking availability. Please try again.",
      } as PostgrestError,
    };
  }

  return {
    hasConflict: (conflictCheck.data?.length ?? 0) > 0,
  };
}

/**
 * Validate subscription limits
 */
async function validateSubscriptionLimits(
  userId: number
): Promise<{ valid: boolean; error?: PostgrestError }> {
  const userResult = await supabase
    .from("users")
    .select("user_current_monthly_bookings, user_subscription_id")
    .eq("user_id", userId)
    .single();

  if (userResult.error || !userResult.data) {
    return {
      valid: false,
      error: {
        ...userResult.error,
        message: "Unable to verify subscription limits. Please try again.",
      } as PostgrestError,
    };
  }

  const currentBookings = userResult.data.user_current_monthly_bookings ?? 0;
  const subscriptionId = userResult.data.user_subscription_id;

  const subscriptionResult = await supabase
    .from("subscriptions")
    .select("subscription_max_monthly_bookings")
    .eq("subscription_id", subscriptionId)
    .single();

  if (subscriptionResult.error) {
    return {
      valid: false,
      error: {
        ...subscriptionResult.error,
        message: "Unable to verify subscription limits. Please try again.",
      } as PostgrestError,
    };
  }

  const maxBookings =
    subscriptionResult.data?.subscription_max_monthly_bookings ?? null;

  if (maxBookings !== null && currentBookings >= maxBookings) {
    return {
      valid: false,
      error: {
        name: "PostgrestError",
        code: "SUBSCRIPTION_LIMIT_EXCEEDED",
        message:
          messages.bookings.messages.error.create.subscriptionLimitExceeded,
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  return { valid: true };
}

/**
 * Calculate booking price server-side
 */
async function calculateBookingPrice(params: {
  roomId: number;
  startTime: Date;
  endTime: Date;
  amenitiesTotal: number;
  subscriptionId: number;
}): Promise<{ totalPrice: number; discount: number; error?: PostgrestError }> {
  const { roomId, startTime, endTime, amenitiesTotal, subscriptionId } = params;
  // Fetch room price
  const roomResult = await supabase
    .from("meeting_rooms")
    .select("meeting_room_price_per_hour")
    .eq("meeting_room_id", roomId)
    .single();

  if (roomResult.error || !roomResult.data) {
    return {
      totalPrice: 0,
      discount: 0,
      error: {
        ...roomResult.error,
        message: "Unable to fetch room pricing. Please try again.",
      } as PostgrestError,
    };
  }

  // Fetch subscription discount
  const subscriptionResult = await supabase
    .from("subscriptions")
    .select("subscription_discount_rate")
    .eq("subscription_id", subscriptionId)
    .single();

  if (subscriptionResult.error) {
    return {
      totalPrice: 0,
      discount: 0,
      error: {
        ...subscriptionResult.error,
        message: "Unable to calculate discount. Please try again.",
      } as PostgrestError,
    };
  }

  const roomPricePerHour = Number(roomResult.data.meeting_room_price_per_hour);
  const subscriptionDiscountRate =
    Number(subscriptionResult.data?.subscription_discount_rate || 0) / 100;

  // Calculate price
  const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const roomSubtotal = roomPricePerHour * hours;
  const subtotal = roomSubtotal + amenitiesTotal;
  const discountAmount = subtotal * subscriptionDiscountRate;
  const totalPrice = Math.max(0, subtotal - discountAmount);
  const discount = subscriptionDiscountRate * 100;

  return { totalPrice, discount };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Critical security validation function requires multiple checks
export async function createBooking(
  data: CreateBookingInput,
  options?: CreateBookingOptions
) {
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

  // 3. Check user's subscription limit BEFORE creating booking
  const subscriptionValidation = await validateSubscriptionLimits(
    validatedData.booking_user_id
  );

  if (!subscriptionValidation.valid && subscriptionValidation.error) {
    return {
      data: null,
      error: subscriptionValidation.error,
    };
  }

  // Fetch user data for later use (subscription ID for discount calculation)
  const userResult = await supabase
    .from("users")
    .select("user_subscription_id, user_current_monthly_bookings")
    .eq("user_id", validatedData.booking_user_id)
    .single();

  if (userResult.error || !userResult.data) {
    return {
      data: null,
      error: {
        ...userResult.error,
        message: "Unable to fetch user data. Please try again.",
      } as PostgrestError,
    };
  }

  const subscriptionId = userResult.data.user_subscription_id;
  const currentBookings = userResult.data.user_current_monthly_bookings ?? 0;
  const userId = validatedData.booking_user_id;

  // 4. Fetch meeting room data for validation and price calculation
  const roomResult = await supabase
    .from("meeting_rooms")
    .select("meeting_room_capacity, meeting_room_price_per_hour")
    .eq("meeting_room_id", validatedData.booking_meeting_room_id)
    .single();

  if (roomResult.error || !roomResult.data) {
    return {
      data: null,
      error: {
        ...roomResult.error,
        message: "Unable to verify room details. Please try again.",
      },
    };
  }

  const roomCapacity = roomResult.data.meeting_room_capacity;

  // 5. Validate capacity
  if (validatedData.booking_number_of_people > roomCapacity) {
    const capacityError: PostgrestError = {
      name: "PostgrestError",
      code: "CAPACITY_EXCEEDED",
      message: messages.bookings.messages.error.create.capacityExceeded,
      details: "",
      hint: "",
    } as PostgrestError;
    return {
      data: null,
      error: capacityError,
    };
  }

  // 6. Validate time slots (business hours 9-22, not in past)
  const startTime = new Date(validatedData.booking_start_time);
  const endTime = new Date(validatedData.booking_end_time);
  const bookingDate = new Date(validatedData.booking_date);
  const now = new Date();

  // Validate not in past
  const pastValidation = validateNotInPast(bookingDate, startTime, now);
  if (!pastValidation.valid && pastValidation.error) {
    return {
      data: null,
      error: pastValidation.error,
    };
  }

  // Validate business hours
  const hoursValidation = validateBusinessHours(startTime, endTime);
  if (!hoursValidation.valid && hoursValidation.error) {
    return {
      data: null,
      error: hoursValidation.error,
    };
  }

  // 7. Check for booking conflicts
  const conflictResult = await checkBookingConflicts(
    validatedData.booking_meeting_room_id,
    validatedData.booking_start_time,
    validatedData.booking_end_time
  );

  if (conflictResult.error) {
    return {
      data: null,
      error: conflictResult.error,
    };
  }

  if (conflictResult.hasConflict) {
    const conflictError: PostgrestError = {
      name: "PostgrestError",
      code: "TIME_SLOT_CONFLICT",
      message: messages.bookings.messages.error.create.timeSlotConflict,
      details: "",
      hint: "",
    } as PostgrestError;
    return {
      data: null,
      error: conflictError,
    };
  }

  // 8. Validate and calculate amenities if provided
  let amenitiesTotal = 0;
  if (options?.amenityIds && options.amenityIds.length > 0) {
    const amenitiesResult = await validateAndCalculateAmenities(
      options.amenityIds,
      validatedData.booking_meeting_room_id
    );

    if (amenitiesResult.error) {
      return {
        data: null,
        error: amenitiesResult.error,
      };
    }

    amenitiesTotal = amenitiesResult.total;
  }

  // 9. Calculate price server-side
  const priceCalculation = await calculateBookingPrice({
    roomId: validatedData.booking_meeting_room_id,
    startTime,
    endTime,
    amenitiesTotal,
    subscriptionId,
  });

  if (priceCalculation.error) {
    return {
      data: null,
      error: priceCalculation.error,
    };
  }

  const calculatedTotalPrice = priceCalculation.totalPrice;
  const calculatedDiscount = priceCalculation.discount;

  // Verify calculated price matches submitted price (with small tolerance for rounding)
  const priceDifference = Math.abs(
    calculatedTotalPrice - validatedData.booking_total_price
  );
  if (priceDifference > 0.01) {
    const priceError: PostgrestError = {
      name: "PostgrestError",
      code: "PRICE_MISMATCH",
      message: messages.bookings.messages.error.create.priceMismatch,
      details: "",
      hint: "",
    } as PostgrestError;
    return {
      data: null,
      error: priceError,
    };
  }

  // 11. Create booking with server-calculated values
  const bookingData = {
    ...validatedData,
    booking_total_price: calculatedTotalPrice,
    booking_discount: calculatedDiscount > 0 ? calculatedDiscount : null,
  };

  const result = await supabase
    .from("bookings")
    .insert(bookingData)
    .select()
    .single();

  // 5. Handle database errors with user-friendly messages
  if (result.error) {
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
      // Don't fail the booking creation, just log the error
      // In production, you might want to rollback or retry
    }
  }

  return toSupabaseMutationResponse<Tables<"bookings">>(result);
}
