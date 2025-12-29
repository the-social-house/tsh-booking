"use server";

import { getCurrentUser } from "@/app/features/auth/actions/get-current-user";
import messages from "@/lib/messages.json";
import { getUser } from "./get-user";

/**
 * Gets the current authenticated user's data from public.users table.
 * Returns null if user is not authenticated or doesn't exist in public.users.
 */
export async function getCurrentUserData() {
  const { user } = await getCurrentUser();

  if (!user) {
    return {
      data: null,
      error: {
        code: "UNAUTHENTICATED",
        message: messages.common.messages.pleaseLogIn,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  const result = await getUser(user.id);

  return result;
}
