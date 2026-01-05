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

/**
 * Get user-friendly error message for CREATE room unavailability operations
 */
export function getCreateRoomUnavailabilityErrorMessage(
  errorCode: string | undefined
): string {
  if (!errorCode) {
    return messages.admin.meetingRooms.messages.error.unavailabilityCreate
      .unknown;
  }

  const errorMessages: Record<string, string> = {
    "23505":
      messages.admin.meetingRooms.messages.error.unavailabilityCreate["23505"],
    "23503":
      messages.admin.meetingRooms.messages.error.unavailabilityCreate["23503"],
    "23502":
      messages.admin.meetingRooms.messages.error.unavailabilityCreate["23502"],
    "23514":
      messages.admin.meetingRooms.messages.error.unavailabilityCreate["23514"],
    OVERLAPPING_DATES:
      messages.admin.meetingRooms.messages.error.unavailabilityCreate
        .overlappingDates,
    BOOKING_CONFLICT:
      messages.admin.meetingRooms.messages.error.unavailabilityCreate
        .bookingConflict,
  };

  return (
    errorMessages[errorCode] ||
    messages.admin.meetingRooms.messages.error.unavailabilityCreate.unknown
  );
}

/**
 * Get user-friendly error message for UPDATE room unavailability operations
 */
export function getUpdateRoomUnavailabilityErrorMessage(
  errorCode: string | undefined
): string {
  if (!errorCode) {
    return messages.admin.meetingRooms.messages.error.unavailabilityUpdate
      .unknown;
  }

  const errorMessages: Record<string, string> = {
    PGRST116:
      messages.admin.meetingRooms.messages.error.unavailabilityUpdate.notFound,
    "23505":
      messages.admin.meetingRooms.messages.error.unavailabilityUpdate["23505"],
    "23503":
      messages.admin.meetingRooms.messages.error.unavailabilityUpdate["23503"],
    "23514":
      messages.admin.meetingRooms.messages.error.unavailabilityUpdate["23514"],
    OVERLAPPING_DATES:
      messages.admin.meetingRooms.messages.error.unavailabilityUpdate
        .overlappingDates,
    BOOKING_CONFLICT:
      messages.admin.meetingRooms.messages.error.unavailabilityUpdate
        .bookingConflict,
  };

  return (
    errorMessages[errorCode] ||
    messages.admin.meetingRooms.messages.error.unavailabilityUpdate.unknown
  );
}

/**
 * Get user-friendly error message for DELETE room unavailability operations
 */
export function getDeleteRoomUnavailabilityErrorMessage(
  errorCode: string | undefined
): string {
  if (!errorCode) {
    return messages.admin.meetingRooms.messages.error.unavailabilityDelete
      .unknown;
  }

  const errorMessages: Record<string, string> = {
    PGRST116:
      messages.admin.meetingRooms.messages.error.unavailabilityDelete.notFound,
    "23503":
      messages.admin.meetingRooms.messages.error.unavailabilityDelete["23503"],
    "23514":
      messages.admin.meetingRooms.messages.error.unavailabilityDelete["23514"],
  };

  return (
    errorMessages[errorCode] ||
    messages.admin.meetingRooms.messages.error.unavailabilityDelete.unknown
  );
}

/**
 * Get user-friendly error message for CREATE amenity operations
 */
export function getCreateAmenityErrorMessage(
  errorCode: string | undefined
): string {
  if (!errorCode) {
    return messages.amenities.messages.error.create.unknown;
  }

  const errorMessages: Record<string, string> = {
    "23505": messages.amenities.messages.error.create["23505"],
    "23503": messages.amenities.messages.error.create["23503"],
    "23502": messages.amenities.messages.error.create["23502"],
    "23514": messages.amenities.messages.error.create["23514"],
  };

  return (
    errorMessages[errorCode] || messages.amenities.messages.error.create.unknown
  );
}

/**
 * Get user-friendly error message for UPDATE amenity operations
 */
export function getUpdateAmenityErrorMessage(
  errorCode: string | undefined
): string {
  if (!errorCode) {
    return messages.amenities.messages.error.update.unknown;
  }

  const errorMessages: Record<string, string> = {
    PGRST116: messages.amenities.messages.error.update.notFound,
    "23505": messages.amenities.messages.error.update["23505"],
    "23503": messages.amenities.messages.error.update["23503"],
    "23514": messages.amenities.messages.error.update["23514"],
  };

  return (
    errorMessages[errorCode] || messages.amenities.messages.error.update.unknown
  );
}

/**
 * Get user-friendly error message for DELETE amenity operations
 */
export function getDeleteAmenityErrorMessage(
  errorCode: string | undefined
): string {
  if (!errorCode) {
    return messages.amenities.messages.error.delete.unknown;
  }

  const errorMessages: Record<string, string> = {
    PGRST116: messages.amenities.messages.error.delete.notFound,
    "23503": messages.amenities.messages.error.delete["23503"],
    "23514": messages.amenities.messages.error.delete["23514"],
  };

  return (
    errorMessages[errorCode] || messages.amenities.messages.error.delete.unknown
  );
}

/**
 * Get user-friendly error message for CREATE invite operations
 */
export function getCreateInviteErrorMessage(
  errorCode: string | undefined
): string {
  if (!errorCode) {
    return messages.admin.ui.tabs.users.invite.messages.error.create.unknown;
  }

  const errorMessages: Record<string, string> = {
    DUPLICATE_INVITE:
      messages.admin.ui.tabs.users.invite.messages.error.create
        .DUPLICATE_INVITE,
    TOKEN_GENERATION_ERROR:
      messages.admin.ui.tabs.users.invite.messages.error.create
        .TOKEN_GENERATION_ERROR,
    USER_ALREADY_EXISTS:
      messages.admin.ui.tabs.users.invite.messages.error.create
        .USER_ALREADY_EXISTS,
    AUTH_ERROR:
      messages.admin.ui.tabs.users.invite.messages.error.create.AUTH_ERROR,
    DATABASE_ERROR:
      messages.admin.ui.tabs.users.invite.messages.error.create.DATABASE_ERROR,
    "23505": messages.admin.ui.tabs.users.invite.messages.error.create["23505"],
    "23503": messages.admin.ui.tabs.users.invite.messages.error.create["23503"],
    "23502": messages.admin.ui.tabs.users.invite.messages.error.create["23502"],
    "23514": messages.admin.ui.tabs.users.invite.messages.error.create["23514"],
  };

  return (
    errorMessages[errorCode] ||
    messages.admin.ui.tabs.users.invite.messages.error.create.unknown
  );
}
