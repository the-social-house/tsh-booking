"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  Clock,
  Coins,
  CreditCard,
  DoorOpen,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { AdminBooking } from "@/app/features/admin/actions/get-all-bookings-admin";
import { BookingActions } from "@/app/features/admin/components/bookings/booking-actions";
import { TableHeaderCell } from "@/app/features/admin/components/meeting-rooms/table-header-cell";
import { Badge } from "@/components/ui/badge";
import { formatBookingTimeRange, formatDate } from "@/lib/format-date-time";
import { formatPrice } from "@/lib/format-price";
import messages from "@/lib/messages.json";

// Type definitions for nested booking data
type BookingUser = {
  user_id: string;
  user_company_name: string;
  user_email: string;
};

type BookingMeetingRoom = {
  meeting_room_id: string;
  meeting_room_name: string;
};

// Type guards and helpers
function isBookingUser(user: unknown): user is BookingUser {
  return (
    typeof user === "object" &&
    user !== null &&
    "user_company_name" in user &&
    "user_email" in user
  );
}

function isBookingMeetingRoom(room: unknown): room is BookingMeetingRoom {
  return (
    typeof room === "object" && room !== null && "meeting_room_name" in room
  );
}

export const bookingsColumns: ColumnDef<AdminBooking>[] = [
  {
    accessorKey: "booking_date",
    header: () => (
      <TableHeaderCell icon={Calendar}>
        {messages.admin.ui.tabs.bookings.table.date}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const date = row.getValue("booking_date");
      if (typeof date !== "string") {
        return "-";
      }
      return formatDate(new Date(date));
    },
  },
  {
    accessorKey: "booking_start_time",
    header: () => (
      <TableHeaderCell icon={Clock}>
        {messages.admin.ui.tabs.bookings.table.time}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const startTime = row.getValue("booking_start_time");
      const endTime = row.original.booking_end_time;
      if (typeof startTime !== "string" || typeof endTime !== "string") {
        return "-";
      }
      return formatBookingTimeRange(startTime, endTime);
    },
  },
  {
    id: "buffer",
    header: () => (
      <TableHeaderCell icon={ShieldCheck}>
        {messages.admin.ui.tabs.bookings.table.buffer}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const bookingType = row.original.booking_is_type_of_booking;
      // Only show buffer for actual bookings, not buffer slots themselves
      if (typeof bookingType === "string" && bookingType === "buffer") {
        return "-";
      }

      const bookingEndTime = row.original.booking_end_time;
      const roomId = row.original.booking_meeting_room_id;

      if (typeof bookingEndTime !== "string" || typeof roomId !== "string") {
        return "-";
      }

      // Look up buffer from the buffers map attached to the booking
      // Buffer starts exactly when this booking ends, same room
      const buffersMap = (
        row.original as AdminBooking & {
          _buffersMap?: Map<string, { start_time: string; end_time: string }>;
        }
      )._buffersMap;

      if (!buffersMap) {
        return "-";
      }

      const key = `${roomId}|${bookingEndTime}`;
      const buffer = buffersMap.get(key);

      if (!buffer) {
        return "-";
      }

      return formatBookingTimeRange(buffer.start_time, buffer.end_time);
    },
  },
  {
    id: "meeting_room",
    header: () => (
      <TableHeaderCell icon={DoorOpen}>
        {messages.admin.ui.tabs.bookings.table.room}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const meetingRoom = row.original.meeting_rooms;
      if (!isBookingMeetingRoom(meetingRoom)) {
        return "-";
      }
      return meetingRoom.meeting_room_name;
    },
  },
  {
    id: "user",
    header: () => (
      <TableHeaderCell icon={Users}>
        {messages.admin.ui.tabs.bookings.table.user}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const user = row.original.users;
      if (!isBookingUser(user)) {
        return "-";
      }
      return (
        <div className="grid">
          <span>{user.user_company_name}</span>
          <span className="text-muted-foreground text-xs">
            {user.user_email}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "booking_number_of_people",
    header: () => (
      <TableHeaderCell icon={Users}>
        {messages.admin.ui.tabs.bookings.table.people}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const people = row.getValue("booking_number_of_people");
      if (typeof people !== "number") {
        return "-";
      }
      return `${people} ${messages.common.words.people}`;
    },
  },
  {
    accessorKey: "booking_total_price",
    header: () => (
      <TableHeaderCell icon={Coins}>
        {messages.admin.ui.tabs.bookings.table.price}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const price = row.getValue("booking_total_price");
      const discount = row.original.booking_discount;
      if (typeof price !== "number") {
        return "-";
      }
      const discountText =
        typeof discount === "number" && discount > 0
          ? ` (${discount}% off)`
          : "";
      return `${formatPrice(price)} ${messages.common.units.currency}${discountText}`;
    },
  },
  {
    accessorKey: "booking_payment_status",
    header: () => (
      <TableHeaderCell icon={CreditCard}>
        {messages.admin.ui.tabs.bookings.table.status}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const status = row.getValue("booking_payment_status");
      if (typeof status !== "string") {
        return "-";
      }

      // Map payment status to badge variant
      const variantMap: Record<
        string,
        "paid" | "pending" | "cancelled" | "confirmed" | "outline"
      > = {
        paid: "paid",
        pending: "pending",
        cancelled: "cancelled",
        confirmed: "confirmed",
      };

      const variant = variantMap[status.toLowerCase()] || "outline";

      return (
        <Badge pill variant={variant}>
          {status}
        </Badge>
      );
    },
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const booking = row.original;
      return <BookingActions booking={booking} />;
    },
  },
];
