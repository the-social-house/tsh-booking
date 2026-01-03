"use client";

import { Calendar, Clock, DoorOpen, Users } from "lucide-react";
import { use } from "react";
import { TableHeaderCell } from "@/app/features/admin/components/meeting-rooms/table-header-cell";
import type { UserUpcomingBooking } from "@/app/features/booking/actions/get-user-upcoming-bookings";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import ErrorFallback from "@/components/ui/error-fallback";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatTime } from "@/lib/format-date-time";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";
import { hasData, hasError } from "@/lib/supabase-response";

type UpcomingBookingsTableProps = Readonly<{
  bookingsPromise: Promise<SupabaseResponse<UserUpcomingBooking[]>>;
}>;

function getRoomName(meetingRoom: unknown): string {
  if (
    meetingRoom &&
    typeof meetingRoom === "object" &&
    meetingRoom !== null &&
    "meeting_room_name" in meetingRoom &&
    typeof meetingRoom.meeting_room_name === "string"
  ) {
    return meetingRoom.meeting_room_name;
  }
  return "Unknown";
}

export function UpcomingBookingsTable({
  bookingsPromise,
}: UpcomingBookingsTableProps) {
  const result = use(bookingsPromise);

  if (hasError(result)) {
    return (
      <ErrorFallback
        description={messages.bookings.ui.upcomingBookings.errorDescription}
        title={messages.bookings.ui.upcomingBookings.errorTitle}
      />
    );
  }

  if (!hasData(result) || result.data.length === 0) {
    return (
      <Card className="p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {messages.bookings.ui.upcomingBookings.emptyTitle}
            </EmptyTitle>
            <EmptyDescription>
              {messages.bookings.ui.upcomingBookings.emptyDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  const bookings = result.data;

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <TableHeaderCell icon={DoorOpen}>
                {messages.bookings.ui.upcomingBookings.table.room}
              </TableHeaderCell>
            </TableHead>
            <TableHead>
              <TableHeaderCell icon={Calendar}>
                {messages.bookings.ui.upcomingBookings.table.date}
              </TableHeaderCell>
            </TableHead>
            <TableHead>
              <TableHeaderCell icon={Users}>
                {messages.bookings.ui.upcomingBookings.table.people}
              </TableHeaderCell>
            </TableHead>
            <TableHead>
              <TableHeaderCell icon={Clock}>
                {messages.bookings.ui.upcomingBookings.table.from}
              </TableHeaderCell>
            </TableHead>
            <TableHead>
              <TableHeaderCell icon={Clock}>
                {messages.bookings.ui.upcomingBookings.table.to}
              </TableHeaderCell>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const roomName = getRoomName(booking.meeting_rooms);

            return (
              <TableRow key={booking.booking_id}>
                <TableCell>{roomName}</TableCell>
                <TableCell>
                  {formatDate(new Date(booking.booking_date))}
                </TableCell>
                <TableCell>{booking.booking_number_of_people}</TableCell>
                <TableCell>{formatTime(booking.booking_start_time)}</TableCell>
                <TableCell>{formatTime(booking.booking_end_time)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
