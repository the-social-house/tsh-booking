// Danish timezone for all date/time operations
export const TIMEZONE = "Europe/Copenhagen";

// Format time from timestamptz to HH:mm
// Note: Database stores Danish times with UTC marker (+00), so we extract
// the time as-is using UTC to avoid double-conversion
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

// Format date for display as DD/MM/YYYY (Danish time)
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

// Format date to YYYY-MM-DD in Danish timezone (for database comparison)
export function formatDateKey(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIMEZONE,
  });
  return formatter.format(date); // Returns YYYY-MM-DD
}

// Check if two dates are the same day in Danish timezone
export function isSameDayDK(date1: Date, date2: Date): boolean {
  return formatDateKey(date1) === formatDateKey(date2);
}

// Get today's date at midnight in Danish timezone
export function getTodayDK(): Date {
  const now = new Date();
  const dateKey = formatDateKey(now);
  // Parse the YYYY-MM-DD string to create a date at midnight UTC
  // This ensures consistent behavior when comparing dates
  return new Date(`${dateKey}T00:00:00`);
}

// Format booking date and time range for display
// Returns formatted string like "DD/MM/YYYY at HH:mm - HH:mm"
export function formatBookingDateTime(
  bookingDate: string,
  bookingStartTime: string,
  bookingEndTime: string
): string {
  const formattedDate = formatDate(new Date(bookingDate));
  const formattedTime = `${formatTime(bookingStartTime)} - ${formatTime(bookingEndTime)}`;
  return `${formattedDate} at ${formattedTime}`;
}

// Format booking time range for display
// Returns formatted string like "HH:mm - HH:mm"
export function formatBookingTimeRange(
  bookingStartTime: string,
  bookingEndTime: string
): string {
  return `${formatTime(bookingStartTime)} - ${formatTime(bookingEndTime)}`;
}

// Get disabled dates configuration for Calendar component
// Disables all dates before today in Danish timezone
export function getDisabledDatesBeforeToday() {
  const today = getTodayDK();
  return { before: today };
}
