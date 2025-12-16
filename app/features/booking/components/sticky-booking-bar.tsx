"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StickyBookingBarProps = {
  roomName: string;
  hourlyRate: number;
  onBookClick: () => void;
  className?: string;
};

export function StickyBookingBar({
  roomName,
  hourlyRate,
  onBookClick,
  className,
}: StickyBookingBarProps) {
  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 left-0 z-40 border-t bg-background shadow-lg",
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{roomName}</h3>
          <p className="text-muted-foreground text-sm">
            ${hourlyRate.toFixed(2)}/hour
          </p>
        </div>
        <Button onClick={onBookClick} size="lg">
          Book Now
        </Button>
      </div>
    </div>
  );
}
