"use client";

import { MoreHorizontalIcon } from "lucide-react";
import type { AdminBooking } from "@/app/features/admin/actions/get-all-bookings-admin";
import { CancelBookingDialog } from "@/app/features/admin/components/bookings/cancel-booking-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import messages from "@/lib/messages.json";

type BookingActionsProps = Readonly<{
  booking: AdminBooking;
}>;

export function BookingActions({ booking }: BookingActionsProps) {
  const paymentStatus = booking.booking_payment_status;
  const isCancelled = paymentStatus === "cancelled";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 w-8 p-0" variant="ghost">
          <span className="sr-only">{messages.admin.ui.table.actions}</span>
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isCancelled ? (
          <DropdownMenuItem disabled>
            {messages.admin.ui.tabs.bookings.actions.alreadyCancelled}
          </DropdownMenuItem>
        ) : (
          <CancelBookingDialog
            bookingDate={booking.booking_date}
            bookingEndTime={booking.booking_end_time}
            bookingId={booking.booking_id}
            bookingStartTime={booking.booking_start_time}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
