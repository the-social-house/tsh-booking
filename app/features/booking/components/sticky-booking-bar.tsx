"use client";

import { RoomPrice } from "@/app/features/meeting-rooms/components/room-price";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import messages from "@/lib/messages.json";
import { cn } from "@/lib/utils";

type BookingUser = {
  subscription_discount?: number;
};

type StickyBookingBarProps = Readonly<{
  roomName: string;
  hourlyRate: number;
  onBookClick: () => void;
  className?: string;
  user: BookingUser;
}>;

export function StickyBookingBar({
  roomName,
  hourlyRate,
  onBookClick,
  className,
  user,
}: StickyBookingBarProps) {
  const subscriptionDiscount = user.subscription_discount ?? 0;
  const totalPrice = formatPrice(hourlyRate);
  const totalPriceWithDiscount = formatPrice(
    hourlyRate * (1 - subscriptionDiscount / 100)
  );

  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 left-0 z-40 border-t bg-background shadow-lg",
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
        <h3 className="whitespace-nowrap font-semibold text-lg">{roomName}</h3>
        {subscriptionDiscount > 0 ? (
          <div className="mr-8 flex w-full items-start justify-end gap-6">
            <RoomPrice
              label={messages.admin.meetingRooms.ui.card.originalPriceLabel}
              original
              price={totalPrice}
            />

            <RoomPrice
              label={messages.admin.meetingRooms.ui.card.memberPriceLabel}
              price={totalPriceWithDiscount}
            />
          </div>
        ) : (
          <div className="flex w-full items-center justify-end gap-4">
            <RoomPrice
              label={messages.admin.meetingRooms.ui.card.priceLabel}
              price={totalPrice}
            />
          </div>
        )}

        <Button onClick={onBookClick} size="lg">
          {messages.bookings.ui.create.submitButton}
        </Button>
      </div>
    </div>
  );
}
