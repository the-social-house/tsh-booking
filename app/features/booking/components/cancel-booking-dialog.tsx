"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cancelBooking } from "@/app/features/booking/actions/cancel-booking";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatErrorForToast } from "@/lib/form-errors";
import { formatBookingDateTime } from "@/lib/format-date-time";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";

type CancelBookingDialogProps = Readonly<{
  bookingId: string;
  bookingDate: string;
  bookingStartTime: string;
  bookingEndTime: string;
}>;

export function CancelBookingDialog({
  bookingId,
  bookingDate,
  bookingStartTime,
  bookingEndTime,
}: CancelBookingDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleCancel() {
    setIsCancelling(true);

    const result = await cancelBooking(bookingId);

    if (hasError(result)) {
      toast.error(formatErrorForToast(result.error));
      setIsCancelling(false);
      return;
    }

    if (hasData(result)) {
      toast.success(messages.bookings.messages.success.cancel);
      setIsOpen(false);
      setIsCancelling(false);
      router.refresh();
    } else {
      toast.error(messages.bookings.messages.error.cancel.failed);
      setIsCancelling(false);
    }
  }

  const formattedDateTime = formatBookingDateTime(
    bookingDate,
    bookingStartTime,
    bookingEndTime
  );

  return (
    <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Cancel booking
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel booking</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this booking? This action cannot be
            undone.
            <span className="mt-2 block font-medium text-foreground">
              {formattedDateTime}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              disabled={isCancelling}
              loading={isCancelling}
              loadingText="Cancelling..."
              onClick={handleCancel}
              variant="destructive"
            >
              Cancel booking
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
