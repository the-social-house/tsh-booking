/**
 * Booking system configuration constants
 */
export const BOOKING_HOURS = {
  START: 9, // 09:00
  END: 22, // 22:00
} as const;

export const TIME_SLOT_INTERVAL = 30; // minutes

/**
 * Generate time slots from start hour to end hour in specified intervals.
 * Last selectable time is 21:30 (bookings can only be made until 21:30).
 * Used for start time selection and booking calculations.
 *
 * @returns Array of time strings in "HH:mm" format (e.g., ["09:00", "09:30", ..., "21:30"])
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  // Calculate slots from START to END-1 (21:00), then add 21:30
  // Total: 9:00 to 21:30 = 12.5 hours = 25 slots of 30 minutes
  const lastHour = BOOKING_HOURS.END - 1; // 21
  const totalMinutes = (lastHour - BOOKING_HOURS.START) * 60; // 12 hours = 720 minutes
  const numberOfSlots = totalMinutes / TIME_SLOT_INTERVAL; // 24 slots

  // Generate slots from 09:00 to 21:00
  for (let i = 0; i <= numberOfSlots; i++) {
    const hours = Math.floor(
      BOOKING_HOURS.START + (i * TIME_SLOT_INTERVAL) / 60
    );
    const minutes = (i * TIME_SLOT_INTERVAL) % 60;
    slots.push(
      `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    );
  }

  // Add the last slot: 21:30
  slots.push(`${lastHour.toString().padStart(2, "0")}:30`);

  return slots;
}

/**
 * Generate end time slots (can't end at START hour, but can end at END hour).
 * Used for end time selection where the end time must be after the start time.
 * Last selectable end time is 22:00 (allows bookings ending at 22:00).
 *
 * @returns Array of time strings in "HH:mm" format (e.g., ["09:30", "10:00", ..., "21:30", "22:00"])
 */
export function generateEndTimeSlots(): string[] {
  const slots: string[] = [];

  // Generate slots from 09:30 to 21:30
  for (
    let hour: number = BOOKING_HOURS.START;
    hour < BOOKING_HOURS.END;
    hour++
  ) {
    for (let minute = 0; minute < 60; minute += TIME_SLOT_INTERVAL) {
      // Skip first slot (can't end at the same time as earliest start)
      if (hour === BOOKING_HOURS.START && minute === 0) {
        continue;
      }
      slots.push(
        `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      );
    }
  }

  // Add 22:00 as the final end time option
  slots.push(`${BOOKING_HOURS.END.toString().padStart(2, "0")}:00`);

  return slots;
}
