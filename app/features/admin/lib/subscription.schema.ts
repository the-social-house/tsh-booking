import { z } from "zod";
import messages from "@/lib/messages.json";
import type { Tables } from "@/supabase/types/database";

/**
 * Type for subscription data from the database
 * This matches the subscriptions table structure
 */
export type Subscription = Tables<"subscriptions">;

/**
 * Schema for updating a user's subscription
 */
export const updateUserSubscriptionSchema = z.object({
  userId: z.uuid("User ID must be a valid UUID"),
  subscriptionId: z.uuid("Subscription ID must be a valid UUID"),
});

export type UpdateUserSubscriptionInput = z.infer<
  typeof updateUserSubscriptionSchema
>;

/**
 * Schema for creating a new subscription
 */
export const createSubscriptionSchema = z.object({
  subscription_name: z
    .string()
    .min(1, messages.admin.subscriptions.validation.name.required)
    .min(2, messages.admin.subscriptions.validation.name.minLength)
    .max(100, messages.admin.subscriptions.validation.name.maxLength)
    .trim(),
  subscription_monthly_price: z
    .number()
    .min(0, messages.admin.subscriptions.validation.monthlyPrice.min)
    .max(99_999.99, messages.admin.subscriptions.validation.monthlyPrice.max),
  subscription_max_monthly_bookings: z
    .number()
    .int(messages.admin.subscriptions.validation.maxMonthlyBookings.integer)
    .min(0, messages.admin.subscriptions.validation.maxMonthlyBookings.min)
    .nullable()
    .optional(),
  subscription_discount_rate: z
    .number()
    .min(0, messages.admin.subscriptions.validation.discountRate.min)
    .max(100, messages.admin.subscriptions.validation.discountRate.max),
});

/**
 * Schema for updating a subscription (all fields optional)
 */
export const updateSubscriptionSchema = z.object({
  subscription_name:
    createSubscriptionSchema.shape.subscription_name.optional(),
  subscription_monthly_price:
    createSubscriptionSchema.shape.subscription_monthly_price.optional(),
  subscription_max_monthly_bookings:
    createSubscriptionSchema.shape.subscription_max_monthly_bookings.optional(),
  subscription_discount_rate:
    createSubscriptionSchema.shape.subscription_discount_rate.optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

/**
 * Schema for validating subscription IDs (used for update/delete)
 */
export const subscriptionIdSchema = z.object({
  id: z.uuid(messages.admin.subscriptions.validation.id.uuid),
});

export type SubscriptionIdInput = z.infer<typeof subscriptionIdSchema>;
