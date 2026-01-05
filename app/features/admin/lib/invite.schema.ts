import { z } from "zod";
import messages from "@/lib/messages.json";

/**
 * Schema for creating a new user invite (admin only)
 */
export const createInviteSchema = z.object({
  email: z.string().email(messages.users.validation.email.invalid).trim(),
  companyName: z
    .string()
    .min(2, messages.users.validation.companyName.minLength)
    .max(50, messages.users.validation.companyName.maxLength)
    .trim(),
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  roleId: z.string().uuid("Invalid role ID"),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
