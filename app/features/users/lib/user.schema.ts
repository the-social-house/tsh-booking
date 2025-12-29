import { z } from "zod";
import messages from "@/lib/messages.json";

/**
 * Schema for fetching a user by ID
 */
export const getUserByIdSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;

/**
 * Schema for updating user profile (company name)
 */
export const updateUserProfileSchema = z.object({
  user_company_name: z
    .string()
    .min(1, messages.users.validation.companyName.required)
    .min(2, messages.users.validation.companyName.minLength)
    .max(50, messages.users.validation.companyName.maxLength)
    .trim()
    .optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

/**
 * Schema for updating user email
 */
export const updateUserEmailSchema = z.object({
  email: z
    .email(messages.users.validation.email.invalid)
    .min(1, messages.users.validation.email.required)
    .trim(),
});

export type UpdateUserEmailInput = z.infer<typeof updateUserEmailSchema>;

/**
 * Schema for updating user password
 */
export const updateUserPasswordSchema = z.object({
  password: z
    .string()
    .min(8, messages.users.validation.password.minLength)
    .max(100, messages.users.validation.password.maxLength),
});

export type UpdateUserPasswordInput = z.infer<typeof updateUserPasswordSchema>;
