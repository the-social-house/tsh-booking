import messages from "@/lib/messages.json";

export function getCreateErrorMessage(errorCode: string | undefined): string {
  if (!errorCode) {
    return messages.bookings.messages.error.create.unknown;
  }

  const errorMessages: Record<string, string> = {
    "23505": messages.bookings.messages.error.create["23505"], // Duplicate
    "23503": messages.bookings.messages.error.create["23503"], // FK violation
    "23502": messages.bookings.messages.error.create["23502"], // Not null
    "23514": messages.bookings.messages.error.create["23514"], // Check violation
    SUBSCRIPTION_LIMIT_EXCEEDED:
      messages.bookings.messages.error.create.subscriptionLimitExceeded,
  };

  return (
    errorMessages[errorCode] || messages.bookings.messages.error.create.unknown
  );
}
