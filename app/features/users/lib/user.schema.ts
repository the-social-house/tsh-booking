import { z } from "zod";
import messages from "@/lib/messages.json";

/**
 * Schema for fetching a user by ID
 */
export const getUserByIdSchema = z.object({
  userId: z
    .number()
    .int(messages.bookings.validation.id.integer)
    .positive(messages.bookings.validation.id.positive),
});

export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
