import { z } from "zod";
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
