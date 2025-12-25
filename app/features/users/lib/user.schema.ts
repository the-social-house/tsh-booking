import { z } from "zod";

/**
 * Schema for fetching a user by ID
 */
export const getUserByIdSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
