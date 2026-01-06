"use client";

import {
  AlertCircleIcon,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Suspense, use, useState } from "react";
import type { BookingWithUser } from "@/app/features/booking/actions/get-booking-slots-with-user";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import ErrorFallback from "@/components/ui/error-fallback";
import Heading from "@/components/ui/heading";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatDate,
  formatDateKey,
  formatTime,
  getDisabledDatesBeforeToday,
  getTodayDK,
  isSameDayDK,
} from "@/lib/format-date-time";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";
import { hasData, hasError } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

type BookingOverviewProps = Readonly<{
  bookingsPromise: Promise<SupabaseResponse<BookingWithUser[]>>;
  meetingRoomsPromise: Promise<SupabaseResponse<Tables<"meeting_rooms">[]>>;
  unavailabilitiesPromise: Promise<
    SupabaseResponse<Tables<"room_unavailabilities">[]>
  >;
  onDateChange?: (date: Date) => void;
}>;

import {
  BOOKING_HOURS,
  generateTimeSlots,
  TIME_SLOT_INTERVAL,
} from "@/lib/booking-time-slots";

// Fixed header height for room name cells (in pixels)
// This ensures consistent time label positioning regardless of room name length
export const ROOM_HEADER_HEIGHT = 80; // pixels

// Calculate row position and span for a booking block
export function calculateBookingPosition(
  startTime: string,
  endTime: string,
  timeSlots: string[],
  isBuffer = false
) {
  // Find the index of the start time slot by matching the time string
  // The time slots array maps directly to grid rows (index 0 = row 2, index 1 = row 3, etc.)
  let startSlotIndex = timeSlots.indexOf(startTime);

  // If exact match not found, calculate the slot index
  if (startSlotIndex === -1) {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startMinutesFromDayStart =
      (startHour - BOOKING_HOURS.START) * 60 + startMinute;
    startSlotIndex = Math.floor(startMinutesFromDayStart / TIME_SLOT_INTERVAL);
    // Ensure it's within bounds
    if (startSlotIndex < 0 || startSlotIndex >= timeSlots.length) {
      startSlotIndex = Math.max(
        0,
        Math.min(startSlotIndex, timeSlots.length - 1)
      );
    }
  }

  // Find the index of the end time slot
  let endSlotIndex = timeSlots.indexOf(endTime);
  if (endSlotIndex === -1) {
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const endMinutesFromDayStart =
      (endHour - BOOKING_HOURS.START) * 60 + endMinute;
    endSlotIndex = Math.floor(endMinutesFromDayStart / TIME_SLOT_INTERVAL);
    if (endSlotIndex < 0 || endSlotIndex >= timeSlots.length) {
      endSlotIndex = Math.max(0, Math.min(endSlotIndex, timeSlots.length - 1));
    }
  }

  // Calculate start row: slot index + 2 (row 1 is header, row 2+ are time slot rows)
  // The grid has:
  // - Row 1: header (auto height)
  // - Row 2: first time slot ("09:00" at index 0)
  // - Row 3: second time slot ("09:30" at index 1)
  // So time slot at index N maps to row N + 2
  const startRow = startSlotIndex + 2;

  // Calculate end row:
  // - For buffers: always include the end slot (buffers should always be visible)
  // - For bookings: if end time is exactly on a slot boundary, exclude that slot
  //   (this prevents overlap with buffers that start at that boundary)
  // - Otherwise, include the partial slot
  // Since gridRowEnd is exclusive, we add 1 to include the calculated slot
  let endRow: number;
  if (isBuffer) {
    // Buffer: 30 minutes = exactly 1 time slot
    // Since buffers are always exactly one slot, endRow is simply startRow + 1
    // (gridRowEnd is exclusive, so +1 includes the single slot)
    endRow = startRow + 1;
  } else if (endSlotIndex >= 0) {
    // Regular booking: end time exactly matches a slot
    // Exclude that slot to leave room for buffer that starts at that exact time
    // endSlotIndex + 2 (for row mapping), no +1 since we're excluding the slot
    endRow = endSlotIndex + 2;
  } else {
    // Regular booking: end time doesn't match a slot exactly
    // Include the partial slot
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const endMinutesFromDayStart =
      (endHour - BOOKING_HOURS.START) * 60 + endMinute;
    const calculatedEndIndex =
      endMinute === 0
        ? Math.floor(endMinutesFromDayStart / TIME_SLOT_INTERVAL)
        : Math.ceil(endMinutesFromDayStart / TIME_SLOT_INTERVAL);
    endRow = calculatedEndIndex + 2 + 1;
  }

  return {
    gridRowStart: startRow,
    gridRowEnd: endRow,
  };
}

export function HomepageBookingOverview({
  bookingsPromise,
  meetingRoomsPromise,
  unavailabilitiesPromise,
  onDateChange,
}: BookingOverviewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(getTodayDK());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const today = getTodayDK();
  const isSelectedToday = isSameDayDK(selectedDate, today);

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateChange?.(date);
      setIsCalendarOpen(false);
    }
  };

  // Format date for next day button (e.g., "4/2/2025")
  const nextDayDate = new Date(selectedDate);
  nextDayDate.setDate(nextDayDate.getDate() + 1);

  return (
    <section className="space-y-4">
      {/* Header */}
      <Heading
        as="h1"
        eyebrow={messages.bookings.ui.overview.eyebrow}
        size="h1"
      >
        {messages.bookings.ui.overview.title}
      </Heading>

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Current Date Display */}
        <p className="text-lg">{formatDate(selectedDate)}</p>

        <div className="flex items-center gap-2 max-md:w-full max-md:justify-between">
          {/* Date Picker */}
          <Popover onOpenChange={setIsCalendarOpen} open={isCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="size-4" />
                {messages.common.messages.pickADate}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                disabled={getDisabledDatesBeforeToday()}
                mode="single"
                onSelect={handleDateSelect}
                selected={selectedDate}
              />
            </PopoverContent>
          </Popover>

          {/* Navigation Buttons */}
          <ButtonGroup className="grid grid-cols-[auto_120px]">
            <Button
              className="text-muted-foreground"
              disabled={isSelectedToday}
              onClick={handlePreviousDay}
              size="icon"
              variant="outline"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <Button
              className="w-full justify-between"
              onClick={handleNextDay}
              variant="outline"
            >
              {formatDate(nextDayDate)}
              <ChevronRight className="size-4" />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* Booking Grid */}
      <BookingGrid
        bookingsPromise={bookingsPromise}
        meetingRoomsPromise={meetingRoomsPromise}
        selectedDate={selectedDate}
        unavailabilitiesPromise={unavailabilitiesPromise}
      />
    </section>
  );
}

type BookingGridProps = Readonly<{
  bookingsPromise: Promise<SupabaseResponse<BookingWithUser[]>>;
  meetingRoomsPromise: Promise<SupabaseResponse<Tables<"meeting_rooms">[]>>;
  unavailabilitiesPromise: Promise<
    SupabaseResponse<Tables<"room_unavailabilities">[]>
  >;
  selectedDate: Date;
}>;

function BookingGrid({
  bookingsPromise,
  meetingRoomsPromise,
  unavailabilitiesPromise,
  selectedDate,
}: BookingGridProps) {
  const meetingRoomsResult = use(meetingRoomsPromise);
  // unavailabilitiesPromise is passed to BookingBlocks

  if (hasError(meetingRoomsResult)) {
    return (
      <ErrorFallback
        description={messages.bookings.ui.overview.meetingRoomsErrorDescription}
        title={messages.bookings.ui.overview.meetingRoomsErrorTitle}
      />
    );
  }

  if (!hasData(meetingRoomsResult)) {
    return null;
  }

  const meetingRooms = meetingRoomsResult.data;
  // Generate time slots and add 22:00 for display (bookings can end at 22:00)
  const timeSlots = [...generateTimeSlots(), "22:00"];

  return (
    <Card className="relative px-2 py-4 pb-5! md:px-6 md:py-0">
      <div className="relative">
        <div
          className="scroll-shadow-x grid overflow-x-auto"
          style={{
            gridTemplateColumns: `52px repeat(${meetingRooms.length}, minmax(120px, 1fr))`,
            // Exclude the last time slot (22:00) from having its own row
            // It will be displayed as a label on the bottom border of the last row
            // Header row uses fixed height for consistent time label positioning
            gridTemplateRows: `${ROOM_HEADER_HEIGHT}px repeat(${timeSlots.length - 1}, 28px)`,
          }}
        >
          {/* Header Row */}
          <div className="sticky left-0 bg-card" />
          {meetingRooms.map((room) => (
            <div
              className="z-10 line-clamp-2 flex items-center justify-center border-b px-2 text-center font-medium text-sm"
              key={room.meeting_room_id}
              style={{
                height: `${ROOM_HEADER_HEIGHT}px`,
              }}
            >
              {room.meeting_room_name}
            </div>
          ))}

          {/* Room Cells - one row per time slot (excluding 22:00 which doesn't need a row) */}
          {timeSlots.slice(0, -1).map((time, index) =>
            meetingRooms.map((room, roomIndex) => (
              <div
                className={`relative border-b ${
                  roomIndex === meetingRooms.length - 1 ? "" : "border-r"
                }`}
                key={`${room.meeting_room_id}-${time}`}
                style={{
                  gridColumn: roomIndex + 2,
                  gridRow: index + 2,
                }}
              />
            ))
          )}

          {/* Booking Blocks (suspends independently) */}
          <Suspense
            fallback={meetingRooms.map((room, index) => (
              <Skeleton
                className="m-0.5 rounded-md"
                key={`loading-booking-${room.meeting_room_id}`}
                style={{
                  gridColumn: index + 2,
                  gridRowStart: 2,
                  gridRowEnd: 19,
                }}
              />
            ))}
          >
            <BookingBlocks
              bookingsPromise={bookingsPromise}
              meetingRooms={meetingRooms}
              selectedDate={selectedDate}
              unavailabilitiesPromise={unavailabilitiesPromise}
            />
          </Suspense>
        </div>

        {/* Time Labels - absolutely positioned on grid lines (top border of each row) */}
        <div className="pointer-events-none absolute top-0 left-0 z-20">
          {timeSlots.map((time, index) => {
            // Calculate top position using fixed header height
            // Position at the top border of each row (moved down one row)
            // For the last time slot (22:00), position it at the bottom border of the last row
            const isLastSlot = index === timeSlots.length - 1;
            // Regular labels: ROOM_HEADER_HEIGHT + index * 28 (positioned at top border of each row, moved down one row)
            // For 22:00: position at bottom of last row
            // Last row index is (timeSlots.length - 2) since we exclude 22:00 from having its own row
            // Bottom of last row: ROOM_HEADER_HEIGHT + (timeSlots.length - 1) * 28
            const topPosition = isLastSlot
              ? ROOM_HEADER_HEIGHT + (timeSlots.length - 1) * 28 // Bottom border of last row
              : ROOM_HEADER_HEIGHT + index * 28; // Top border of row
            return (
              <div
                className="sticky left-0 z-20 flex w-[52px] items-center justify-center text-muted-foreground text-sm"
                key={`time-${time}`}
                style={{
                  position: "absolute",
                  top: `${topPosition}px`,
                  left: 0,
                  height: "1px",
                  transform: isLastSlot
                    ? "translateY(-50%)"
                    : "translateY(-1px)",
                }}
              >
                <span>{time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

type BookingBlocksProps = Readonly<{
  bookingsPromise: Promise<SupabaseResponse<BookingWithUser[]>>;
  unavailabilitiesPromise: Promise<
    SupabaseResponse<Tables<"room_unavailabilities">[]>
  >;
  meetingRooms: Tables<"meeting_rooms">[];
  selectedDate: Date;
}>;

function BookingBlocks({
  bookingsPromise,
  unavailabilitiesPromise,
  meetingRooms,
  selectedDate,
}: BookingBlocksProps) {
  const bookingsResult = use(bookingsPromise);
  const unavailabilitiesResult = use(unavailabilitiesPromise);

  if (hasError(bookingsResult)) {
    return (
      <div
        className="relative flex flex-col items-center justify-center bg-muted p-6"
        style={{
          gridColumn: 5,
          gridRowStart: 2,
          gridRowEnd: 19,
          gridColumnStart: "2",
          gridColumnEnd: "-1",
        }}
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircleIcon className="size-10 text-destructive" />
            </EmptyMedia>
            <EmptyTitle>
              {messages.bookings.ui.overview.bookingsErrorTitle}
            </EmptyTitle>
            <EmptyDescription>
              {messages.bookings.ui.overview.bookingsErrorDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!hasData(bookingsResult)) {
    return null;
  }

  const initialBookings = bookingsResult.data;
  // Use Danish timezone date (YYYY-MM-DD) to match booking_date from the database
  const selectedDateKey = formatDateKey(selectedDate);
  const bookingsForSelectedDate = initialBookings.filter(
    (booking) => booking.booking_date === selectedDateKey
  );

  // Handle unavailabilities
  const unavailabilitiesForSelectedDate: Tables<"room_unavailabilities">[] = [];
  if (hasData(unavailabilitiesResult)) {
    unavailabilitiesForSelectedDate.push(
      ...unavailabilitiesResult.data.filter((unavailability) => {
        // Check if selected date falls within the unavailability range
        const startDate = new Date(unavailability.unavailable_start_date);
        const endDate = new Date(unavailability.unavailable_end_date);
        const selected = new Date(selectedDateKey);
        return selected >= startDate && selected <= endDate;
      })
    );
  }

  // Generate time slots once for all bookings and add 22:00 for display (bookings can end at 22:00)
  const timeSlots = [...generateTimeSlots(), "22:00"];

  // Calculate position for full-day unavailability (09:00 to 22:00)
  const fullDayPosition = calculateBookingPosition(
    `${BOOKING_HOURS.START.toString().padStart(2, "0")}:00`,
    `${BOOKING_HOURS.END.toString().padStart(2, "0")}:00`,
    timeSlots,
    false
  );

  return (
    <>
      {/* Render unavailabilities */}
      {unavailabilitiesForSelectedDate.map((unavailability) => {
        const roomIndex = meetingRooms.findIndex(
          (room) => room.meeting_room_id === unavailability.meeting_room_id
        );
        if (roomIndex === -1) {
          return null;
        }

        return (
          <div
            className="relative z-0 m-0.5 flex flex-col flex-wrap justify-between gap-1 overflow-hidden rounded-md border border-foreground/10 bg-muted-foreground p-1 text-muted text-xs"
            key={unavailability.unavailability_id}
            style={{
              gridColumn: roomIndex + 2,
              gridRowStart: fullDayPosition.gridRowStart,
              gridRowEnd: fullDayPosition.gridRowEnd,
            }}
          >
            <div className="line-clamp-2 font-medium">
              {messages.bookings.ui.overview.roomUnavailable}
            </div>
            {unavailability.unavailability_reason ? (
              <div className="text-xs">
                {messages.common.words.reason} -{" "}
                {unavailability.unavailability_reason}
              </div>
            ) : null}
          </div>
        );
      })}

      {/* Render bookings */}
      {bookingsForSelectedDate.map((booking) => {
        const roomIndex = meetingRooms.findIndex(
          (room) => room.meeting_room_id === booking.booking_meeting_room_id
        );
        if (roomIndex === -1) {
          return null;
        }

        const isBuffer = booking.booking_is_type_of_booking === "buffer";

        const position = calculateBookingPosition(
          formatTime(booking.booking_start_time),
          formatTime(booking.booking_end_time),
          timeSlots,
          isBuffer
        );

        // Calculate if booking is 30 minutes
        const startTime = new Date(booking.booking_start_time);
        const endTime = new Date(booking.booking_end_time);
        const durationMinutes =
          (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        const is30Minutes = durationMinutes === 30;

        const bookingBlockClassName = isBuffer
          ? "border border-foreground/10 bg-muted-foreground"
          : "flex flex-col flex-wrap justify-between gap-1 bg-primary text-primary-foreground";

        // Wrap with tooltip if 30 minutes and not a buffer, otherwise return block directly
        const shouldShowTooltip = is30Minutes === true && isBuffer === false;
        const bookingElement = shouldShowTooltip ? (
          <Tooltip key={booking.booking_id}>
            <TooltipTrigger asChild>
              <div
                className={`relative z-10 m-0.5 overflow-hidden rounded-md p-1 ${bookingBlockClassName}`}
                style={{
                  gridColumn: roomIndex + 2,
                  gridRowStart: position.gridRowStart,
                  gridRowEnd: position.gridRowEnd,
                }}
              >
                {!isBuffer && (
                  <>
                    <div className="line-clamp-2 font-medium text-xs">
                      {booking.users.user_company_name}
                    </div>
                    <div className="text-xs">
                      {formatTime(booking.booking_start_time)} -{" "}
                      {formatTime(booking.booking_end_time)}
                    </div>
                  </>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div className="font-medium">
                  {booking.users.user_company_name}
                </div>
                <div className="text-xs">
                  {formatTime(booking.booking_start_time)} -{" "}
                  {formatTime(booking.booking_end_time)}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div
            className={`relative z-10 m-0.5 overflow-hidden rounded-md p-1 ${bookingBlockClassName}`}
            key={booking.booking_id}
            style={{
              gridColumn: roomIndex + 2,
              gridRowStart: position.gridRowStart,
              gridRowEnd: position.gridRowEnd,
            }}
          >
            {!isBuffer && (
              <>
                <div className="line-clamp-2 font-medium text-xs">
                  {booking.users.user_company_name}
                </div>
                <div className="text-xs">
                  {formatTime(booking.booking_start_time)} -{" "}
                  {formatTime(booking.booking_end_time)}
                </div>
              </>
            )}
          </div>
        );

        return bookingElement;
      })}
    </>
  );
}
