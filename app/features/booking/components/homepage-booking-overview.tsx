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
  formatDate,
  formatDateKey,
  formatTime,
  isSameDayDK,
} from "@/lib/format-date-time";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";
import { hasData, hasError } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

type BookingOverviewProps = {
  bookingsPromise: Promise<SupabaseResponse<BookingWithUser[]>>;
  meetingRoomsPromise: Promise<SupabaseResponse<Tables<"meeting_rooms">[]>>;
  onDateChange?: (date: Date) => void;
};

// Configuration constants for booking system
export const BOOKING_HOURS = {
  START: 9, // 09:00
  END: 17, // 17:00
} as const;

export const TIME_SLOT_INTERVAL = 30; // minutes

// Calculate row position and span for a booking block
export function calculateBookingPosition(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutesFromDayStart =
    (startHour - BOOKING_HOURS.START) * 60 + startMinute;
  const endMinutesFromDayStart =
    (endHour - BOOKING_HOURS.START) * 60 + endMinute;

  const startRow =
    Math.floor(startMinutesFromDayStart / TIME_SLOT_INTERVAL) + 2; // +2 for header row
  const durationInSlots =
    (endMinutesFromDayStart - startMinutesFromDayStart) / TIME_SLOT_INTERVAL;

  return {
    gridRowStart: startRow,
    gridRowEnd: startRow + durationInSlots,
  };
}

// Generate time slots for the day
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const totalMinutes = (BOOKING_HOURS.END - BOOKING_HOURS.START) * 60;
  const numberOfSlots = totalMinutes / TIME_SLOT_INTERVAL;

  for (let i = 0; i <= numberOfSlots; i++) {
    const hours = Math.floor(
      BOOKING_HOURS.START + (i * TIME_SLOT_INTERVAL) / 60
    );
    const minutes = (i * TIME_SLOT_INTERVAL) % 60;
    slots.push(
      `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    );
  }

  return slots;
}

export function HomepageBookingOverview({
  bookingsPromise,
  meetingRoomsPromise,
  onDateChange,
}: BookingOverviewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const today = new Date();
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
      <Heading as="h2" size="h2">
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
                disabled={{ before: today }}
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
      />
    </section>
  );
}

type BookingGridProps = {
  bookingsPromise: Promise<SupabaseResponse<BookingWithUser[]>>;
  meetingRoomsPromise: Promise<SupabaseResponse<Tables<"meeting_rooms">[]>>;
  selectedDate: Date;
};

function BookingGrid({
  bookingsPromise,
  meetingRoomsPromise,
  selectedDate,
}: BookingGridProps) {
  const meetingRoomsResult = use(meetingRoomsPromise);

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
  const timeSlots = generateTimeSlots();

  return (
    <Card className="relative px-2 py-2 md:px-6 md:py-6">
      <div
        className="scroll-shadow-x grid overflow-x-auto"
        style={{
          gridTemplateColumns: `52px repeat(${meetingRooms.length}, minmax(120px, 1fr))`,
          gridTemplateRows: `auto repeat(${timeSlots.length}, 28px)`,
        }}
      >
        {/* Header Row */}
        <div className="sticky left-0 z-10 border bg-card" />
        {meetingRooms.map((room) => (
          <div
            className="flex items-center justify-center border-t border-r border-b p-2 text-center font-normal text-sm"
            key={room.meeting_room_id}
          >
            {room.meeting_room_name}
          </div>
        ))}

        {/* Time Slots */}
        {timeSlots.map((time, index) => (
          <div className="contents" key={time}>
            {/* Time Label */}
            <div className="sticky left-0 z-20 flex items-center justify-center border-x border-b bg-card text-muted-foreground text-sm">
              {time}
            </div>

            {/* Room Cells */}
            {meetingRooms.map((room, roomIndex) => (
              <div
                className="relative border-r border-b"
                key={`${room.meeting_room_id}-${time}`}
                style={{
                  gridColumn: roomIndex + 2,
                  gridRow: index + 2,
                }}
              />
            ))}
          </div>
        ))}

        {/* Booking Blocks (suspends independently) */}
        <Suspense
          fallback={meetingRooms.map((room, index) => (
            <Skeleton
              className="m-1 rounded-md"
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
          />
        </Suspense>
      </div>
    </Card>
  );
}

type BookingBlocksProps = {
  bookingsPromise: Promise<SupabaseResponse<BookingWithUser[]>>;
  meetingRooms: Tables<"meeting_rooms">[];
  selectedDate: Date;
};

function BookingBlocks({
  bookingsPromise,
  meetingRooms,
  selectedDate,
}: BookingBlocksProps) {
  const bookingsResult = use(bookingsPromise);

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

  return (
    <>
      {bookingsForSelectedDate.map((booking) => {
        const roomIndex = meetingRooms.findIndex(
          (room) => room.meeting_room_id === booking.booking_meeting_room_id
        );
        if (roomIndex === -1) {
          return null;
        }

        const position = calculateBookingPosition(
          formatTime(booking.booking_start_time),
          formatTime(booking.booking_end_time)
        );

        return (
          <div
            className="relative z-10 m-1 flex flex-col justify-between rounded-md bg-primary p-2 text-primary-foreground text-sm"
            key={booking.booking_id}
            style={{
              gridColumn: roomIndex + 2,
              gridRowStart: position.gridRowStart,
              gridRowEnd: position.gridRowEnd,
            }}
          >
            <div className="font-medium">{booking.users.user_username}</div>
            <div className="text-xs">
              {formatTime(booking.booking_start_time)} -
              {formatTime(booking.booking_end_time)}
            </div>
          </div>
        );
      })}
    </>
  );
}
