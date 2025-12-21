"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";
import BookingForm from "@/app/features/booking/components/booking-form";
import { StickyBookingBar } from "@/app/features/booking/components/sticky-booking-bar";
import type { RoomAmenity } from "@/app/features/meeting-rooms/actions/get-room-amenities";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Tables } from "@/supabase/types/database";

type MeetingRoom = Tables<"meeting_rooms">;

type BookingUser = {
  user_id: number;
  user_email: string;
  subscription_discount?: number;
};

type BookingDrawerWrapperProps = {
  meetingRoom: MeetingRoom;
  roomAmenities: RoomAmenity[];
  user: BookingUser;
};

export function BookingDrawerWrapper({
  meetingRoom,
  roomAmenities,
  user,
}: BookingDrawerWrapperProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <StickyBookingBar
        hourlyRate={meetingRoom.meeting_room_price_per_hour}
        onBookClick={() => setDrawerOpen(true)}
        roomName={meetingRoom.meeting_room_name}
      />
      <Drawer onOpenChange={setDrawerOpen} open={drawerOpen}>
        <DrawerContent className="mx-auto max-h-[95vh]! max-w-[95vw]">
          <DrawerHeader className="flex flex-row items-center justify-between">
            <DrawerTitle>{meetingRoom.meeting_room_name}</DrawerTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setDrawerOpen(false)} size="icon">
                <XIcon />
              </Button>
            </div>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <BookingForm
              isOpen={drawerOpen}
              meetingRoom={meetingRoom}
              onSuccess={() => setDrawerOpen(false)}
              roomAmenities={roomAmenities}
              user={user}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
