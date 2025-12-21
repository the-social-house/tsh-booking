import messages from "@/lib/messages.json";

/**
 * Get user-friendly error message for CREATE meeting room operations
 */
export function getCreateMeetingRoomErrorMessage(
  errorCode: string | undefined
): string {
  if (!errorCode) {
    return messages.admin.meetingRooms.messages.error.create.unknown;
  }

  const errorMessages: Record<string, string> = {
    "23505": messages.admin.meetingRooms.messages.error.create["23505"],
    "23503": messages.admin.meetingRooms.messages.error.create["23503"],
    "23502": messages.admin.meetingRooms.messages.error.create["23502"],
    "23514": messages.admin.meetingRooms.messages.error.create["23514"],
  };

  return (
    errorMessages[errorCode] ||
    messages.admin.meetingRooms.messages.error.create.unknown
  );
}

/**
 * Get user-friendly error message for UPDATE meeting room operations
 */
export function getUpdateMeetingRoomErrorMessage(
  errorCode: string | undefined
): string {
  if (!errorCode) {
    return messages.admin.meetingRooms.messages.error.update.unknown;
  }

  const errorMessages: Record<string, string> = {
    PGRST116: messages.admin.meetingRooms.messages.error.update.notFound,
    "23505": messages.admin.meetingRooms.messages.error.update["23505"],
    "23503": messages.admin.meetingRooms.messages.error.update["23503"],
    "23514": messages.admin.meetingRooms.messages.error.update["23514"],
  };

  return (
    errorMessages[errorCode] ||
    messages.admin.meetingRooms.messages.error.update.unknown
  );
}

/**
 * Get user-friendly error message for DELETE meeting room operations
 */
export function getDeleteMeetingRoomErrorMessage(
  errorCode: string | undefined
): string {
  if (!errorCode) {
    return messages.admin.meetingRooms.messages.error.delete.unknown;
  }

  const errorMessages: Record<string, string> = {
    PGRST116: messages.admin.meetingRooms.messages.error.delete.notFound,
    "23503": messages.admin.meetingRooms.messages.error.delete["23503"],
    "23514": messages.admin.meetingRooms.messages.error.delete["23514"],
  };

  return (
    errorMessages[errorCode] ||
    messages.admin.meetingRooms.messages.error.delete.unknown
  );
}
