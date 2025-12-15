"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import messages from "@/lib/messages.json";

/**
 * Booking slot data for conflict detection
 */
type ExistingBooking = {
  booking_date: string;
  booking_start_time: string;
  booking_end_time: string;
};

type CalendarBookingProps = {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  selectedTime?: string | null;
  onTimeChange: (time: string | null) => void;
  endTime?: string;
  onEndTimeChange?: (time: string) => void;
  numberOfPeople?: string;
  onNumberOfPeopleChange?: (value: string) => void;
  maxCapacity?: number;
  bookedDates?: Date[];
  disabled?: boolean;
  timeSlotInterval?: number; // minutes between slots (default: 30)
  startHour?: number; // earliest booking hour (default: 9)
  endHour?: number; // latest booking end hour (default: 22)
  existingBookings?: ExistingBooking[]; // Existing bookings for conflict detection
};

// Get current time in Danish timezone
const getCurrentDanishTime = () =>
  new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Copenhagen" })
  );

// Check if a date is today (Danish timezone)
const isToday = (selectedDate: Date | undefined): boolean => {
  if (!selectedDate) {
    return false;
  }

  const today = getCurrentDanishTime();
  today.setHours(0, 0, 0, 0);

  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);

  return selected.getTime() === today.getTime();
};

// Get minimum allowed time for current day (rounded up to next interval)
const getMinimumAllowedTime = (
  selectedDate: Date | undefined,
  interval: number
): string | null => {
  if (!isToday(selectedDate)) {
    return null;
  }

  const now = getCurrentDanishTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Round up to next interval (e.g., 14:23 with 30-min interval → 14:30)
  const roundedMinutes = Math.ceil(currentMinutes / interval) * interval;

  const hour = Math.floor(roundedMinutes / 60);
  const minute = roundedMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

// Helper: Extract HH:mm from ISO timestamp (e.g., "2025-01-15T14:30:00" -> "14:30")
const extractTime = (isoTimestamp: string): string => {
  const timePart = isoTimestamp.split("T")[1];
  if (!timePart) {
    return "";
  }
  return timePart.slice(0, 5);
};

// Helper: Convert HH:mm to minutes from midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper: Format date as YYYY-MM-DD
const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function CalendarBooking({
  date,
  onDateChange,
  selectedTime,
  onTimeChange,
  endTime,
  onEndTimeChange,
  numberOfPeople,
  onNumberOfPeopleChange,
  maxCapacity,
  bookedDates = [],
  disabled = false,
  timeSlotInterval = 30,
  startHour = 9,
  endHour = 22,
  existingBookings = [],
}: CalendarBookingProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const firstAvailableRef = useRef<HTMLButtonElement>(null);

  // Track client-side mount to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  const [todayMidnight, setTodayMidnight] = useState<Date | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const today = getCurrentDanishTime();
    today.setHours(0, 0, 0, 0);
    setTodayMidnight(today);
  }, []);

  // Generate all possible start time slots
  const allTimeSlots = useMemo(() => {
    const slots: string[] = [];
    const totalMinutes = (endHour - startHour) * 60;
    const numberOfSlots = Math.floor(totalMinutes / timeSlotInterval);

    for (let i = 0; i <= numberOfSlots; i++) {
      const minutesFromStart = i * timeSlotInterval + startHour * 60;
      const hour = Math.floor(minutesFromStart / 60);
      const minute = minutesFromStart % 60;

      // Don't include end hour (last slot should be interval before end)
      if (hour >= endHour) {
        break;
      }

      slots.push(
        `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      );
    }

    return slots;
  }, [timeSlotInterval, startHour, endHour]);

  // Generate end time slots (30-minute intervals)
  const endTimeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip first slot (can't end at the same time as earliest start)
        if (hour === startHour && minute === 0) {
          continue;
        }
        // Include end hour as the last possible end time
        if (hour === endHour && minute > 0) {
          break;
        }
        slots.push(
          `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        );
      }
    }
    return slots;
  }, [startHour, endHour]);

  // Get bookings for the selected date (MUST be before hooks that depend on it)
  const bookingsForSelectedDate = useMemo(() => {
    if (!date) {
      return [];
    }
    const selectedDateISO = formatDateISO(date);

    // Normalize booking dates to YYYY-MM-DD format (handle string formats)
    const filtered = existingBookings.filter((booking) => {
      // Normalize booking_date - extract YYYY-MM-DD from string
      let bookingDateStr = booking.booking_date;
      // If it includes a time component (T), extract just the date part
      if (typeof bookingDateStr === "string" && bookingDateStr.includes("T")) {
        bookingDateStr = bookingDateStr.split("T")[0];
      }
      // booking_date should already be in YYYY-MM-DD format from Supabase
      return bookingDateStr === selectedDateISO;
    });

    // Debug logging
    if (filtered.length > 0) {
      console.log("📅 Selected date:", selectedDateISO);
      console.log("📋 Bookings for selected date:", filtered);
    }

    return filtered;
  }, [date, existingBookings]);

  // Check if a time slot overlaps with any existing booking (returns a memoized function)
  const isTimeSlotBooked = useMemo(() => {
    return (slotTime: string): boolean => {
      const slotMinutes = timeToMinutes(slotTime);

      const isBooked = bookingsForSelectedDate.some((booking) => {
        const bookingStartTimeStr = extractTime(booking.booking_start_time);
        const bookingEndTimeStr = extractTime(booking.booking_end_time);

        const bookingStart = timeToMinutes(bookingStartTimeStr);
        const bookingEnd = timeToMinutes(bookingEndTimeStr);

        // A slot is booked if it falls within an existing booking range
        // (start time >= booking start AND start time < booking end)
        const overlaps =
          slotMinutes >= bookingStart && slotMinutes < bookingEnd;

        if (overlaps) {
          console.log(
            `🚫 Slot ${slotTime} overlaps with booking ${bookingStartTimeStr}-${bookingEndTimeStr}`
          );
        }

        return overlaps;
      });

      return isBooked;
    };
  }, [bookingsForSelectedDate]);

  // Find the next booking's start time after the selected start time
  const nextBookingStartMinutes = useMemo(() => {
    if (!(selectedTime && date)) {
      return null;
    }

    const selectedMinutes = timeToMinutes(selectedTime);
    let nearestStart: number | null = null;

    for (const booking of bookingsForSelectedDate) {
      const bookingStart = timeToMinutes(
        extractTime(booking.booking_start_time)
      );

      // Only consider bookings that start after our selected start time
      if (
        bookingStart > selectedMinutes &&
        (nearestStart === null || bookingStart < nearestStart)
      ) {
        nearestStart = bookingStart;
      }
    }

    return nearestStart;
  }, [selectedTime, date, bookingsForSelectedDate]);

  // Filter end time slots based on selected start time and next booking
  const availableEndTimeSlots = useMemo(() => {
    if (!(selectedTime && date)) {
      return [];
    }
    const startMinutes = timeToMinutes(selectedTime);

    // Check if the selected start time itself overlaps with any booking
    const startTimeOverlaps = bookingsForSelectedDate.some((booking) => {
      const bookingStart = timeToMinutes(
        extractTime(booking.booking_start_time)
      );
      const bookingEnd = timeToMinutes(extractTime(booking.booking_end_time));
      // Check if selected start time falls within this booking
      return startMinutes >= bookingStart && startMinutes < bookingEnd;
    });

    // If start time overlaps with a booking, no end times are available
    if (startTimeOverlaps) {
      return [];
    }

    return endTimeSlots.filter((time) => {
      const endMinutes = timeToMinutes(time);

      // Must be at least 30 minutes after start time
      if (endMinutes < startMinutes + 30) {
        return false;
      }

      // Must not exceed end hour
      if (endMinutes > endHour * 60) {
        return false;
      }

      // Check if this end time overlaps with any booking
      const endTimeOverlaps = bookingsForSelectedDate.some((booking) => {
        const bookingStart = timeToMinutes(
          extractTime(booking.booking_start_time)
        );
        const bookingEnd = timeToMinutes(extractTime(booking.booking_end_time));
        // Check if end time falls within this booking range
        // OR if the booking falls within our selected time range
        return (
          (endMinutes > bookingStart && endMinutes <= bookingEnd) ||
          (startMinutes < bookingEnd && endMinutes > bookingStart)
        );
      });

      if (endTimeOverlaps) {
        return false;
      }

      // Must not overlap with next booking
      if (
        nextBookingStartMinutes !== null &&
        endMinutes > nextBookingStartMinutes
      ) {
        return false;
      }

      return true;
    });
  }, [
    selectedTime,
    date,
    endTimeSlots,
    endHour,
    nextBookingStartMinutes,
    bookingsForSelectedDate,
  ]);

  // Filter available time slots based on date, current time, and existing bookings
  const { availableSlots, bookedSlots, firstAvailableTime, hasNoSlots } =
    useMemo(() => {
      // Before mount, all slots are available (for SSR consistency)
      if (!isMounted) {
        return {
          availableSlots: allTimeSlots,
          bookedSlots: [] as string[],
          firstAvailableTime: allTimeSlots[0] || null,
          hasNoSlots: false,
        };
      }

      const minTime = getMinimumAllowedTime(date, timeSlotInterval);
      const available: string[] = [];
      const booked: string[] = [];

      for (const time of allTimeSlots) {
        // If today, filter out times before minimum
        if (minTime && time < minTime) {
          continue;
        }

        // Check if slot is booked
        if (isTimeSlotBooked(time)) {
          booked.push(time);
        } else {
          available.push(time);
        }
      }

      return {
        availableSlots: available,
        bookedSlots: booked,
        firstAvailableTime: available[0] || null,
        hasNoSlots: available.length === 0 && isToday(date),
      };
    }, [allTimeSlots, date, timeSlotInterval, isMounted, isTimeSlotBooked]);

  // Auto-scroll to first available time slot when it changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: firstAvailableTime triggers scroll to ref element
  useEffect(() => {
    if (!isMounted) {
      return;
    }
    // Small delay to ensure DOM is updated after render
    const timeoutId = setTimeout(() => {
      const scrollTarget = firstAvailableRef.current;
      const scrollContainer = scrollContainerRef.current;
      if (scrollTarget && scrollContainer) {
        scrollTarget.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [firstAvailableTime, isMounted]);

  // Clear selected time if it's no longer available
  useEffect(() => {
    if (isMounted && selectedTime && !availableSlots.includes(selectedTime)) {
      onTimeChange(null);
    }
  }, [availableSlots, selectedTime, onTimeChange, isMounted]);

  // Clear end time if start time changes and end time is no longer valid
  useEffect(() => {
    if (
      endTime &&
      onEndTimeChange &&
      !availableEndTimeSlots.includes(endTime)
    ) {
      onEndTimeChange("");
    }
  }, [availableEndTimeSlots, endTime, onEndTimeChange]);

  // Disable function for calendar (only active after mount)
  const isDateDisabled = (calendarDate: Date): boolean => {
    if (disabled) {
      return true;
    }
    // Before mount, don't disable dates (SSR consistency)
    if (!todayMidnight) {
      return false;
    }
    return calendarDate < todayMidnight;
  };

  // Show skeleton while mounting to avoid hydration issues
  if (!isMounted) {
    return (
      <Card className="gap-0 p-0">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-3">
            {/* Column 1: Calendar skeleton */}
            <div className="p-6 lg:border-r">
              <Skeleton className="h-[280px] w-full" />
            </div>
            {/* Column 2: Start time skeleton */}
            <div className="flex flex-col gap-2 border-t p-4 lg:border-t-0 lg:border-r">
              <Skeleton className="mb-2 h-4 w-20" />
              {allTimeSlots.slice(0, 6).map((time) => (
                <Skeleton className="h-8 w-full" key={time} />
              ))}
            </div>
            {/* Column 3: End time + people skeleton */}
            <div className="flex flex-col gap-4 border-t p-4 lg:border-t-0">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t px-6 py-5! md:flex-row">
          <Skeleton className="h-5 w-64" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-0">
      <CardContent className="p-0">
        {/* 3-Column Layout: Calendar | Start Time | End Time + People */}
        <div className="grid lg:grid-cols-3">
          {/* Column 1: Calendar */}
          <div className="p-6 lg:border-r">
            <Calendar
              className="bg-transparent p-0 [--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
              classNames={{
                // Override today style: use ring instead of full background
                today:
                  "rounded-md ring-2 ring-primary/30 ring-inset text-foreground data-[selected=true]:ring-0",
              }}
              defaultMonth={date}
              disabled={isDateDisabled}
              formatters={{
                formatWeekdayName: (weekdayDate) =>
                  weekdayDate.toLocaleString("en-US", { weekday: "short" }),
              }}
              mode="single"
              modifiers={{
                booked: bookedDates,
              }}
              modifiersClassNames={{
                booked: "[&>button]:line-through opacity-100",
              }}
              onSelect={onDateChange}
              selected={date}
              showOutsideDays={false}
            />
          </div>

          {/* Column 2: Start Time Presets */}
          <div
            className="no-scrollbar flex flex-col gap-2 overflow-y-auto border-t p-4 lg:max-h-[340px] lg:border-t-0 lg:border-r"
            ref={scrollContainerRef}
          >
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Start Time
            </p>
            {hasNoSlots ? (
              <div className="text-center text-muted-foreground text-sm">
                {messages.bookings.ui.create.noSlotsToday}
              </div>
            ) : (
              <div className="grid gap-1.5">
                {allTimeSlots.map((time) => {
                  const isAvailable = availableSlots.includes(time);
                  const isBooked = bookedSlots.includes(time);
                  const isFirstAvailable = time === firstAvailableTime;

                  return (
                    <Button
                      className={`h-8 w-full text-sm shadow-none ${isBooked ? "line-through opacity-50" : ""}`}
                      disabled={disabled || !isAvailable}
                      key={time}
                      onClick={() => onTimeChange(time)}
                      ref={isFirstAvailable ? firstAvailableRef : null}
                      size="sm"
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 3: End Time + Number of People */}
          {(onEndTimeChange !== undefined ||
            onNumberOfPeopleChange !== undefined) && (
            <div className="flex flex-col gap-4 border-t p-4 lg:border-t-0">
              {/* End Time Dropdown */}
              {onEndTimeChange !== undefined && (
                <div>
                  <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    End Time
                  </p>
                  <Select
                    disabled={disabled || !selectedTime}
                    onValueChange={onEndTimeChange}
                    value={endTime}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEndTimeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Number of People */}
              {onNumberOfPeopleChange !== undefined && (
                <div>
                  <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Number of People
                  </p>
                  <Input
                    className="h-9 w-full"
                    disabled={disabled}
                    max={maxCapacity}
                    min="1"
                    onChange={(e) => onNumberOfPeopleChange(e.target.value)}
                    placeholder="Enter number"
                    type="number"
                    value={numberOfPeople}
                  />
                  {maxCapacity !== undefined && maxCapacity > 0 && (
                    <p className="mt-1 text-muted-foreground text-xs">
                      Max: {maxCapacity}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t px-6 py-5! md:flex-row">
        <div className="text-sm">
          {date !== undefined &&
          selectedTime !== undefined &&
          selectedTime !== null ? (
            <>
              Your meeting starts on{" "}
              <span className="font-medium">
                {date.toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
              </span>
              at <span className="font-medium">{selectedTime}</span>
              {endTime !== undefined && endTime !== "" && (
                <>
                  {" "}
                  until <span className="font-medium">{endTime}</span>
                </>
              )}
              .
            </>
          ) : (
            <>Select a date and time for your meeting.</>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
