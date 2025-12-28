"use client";

import { Activity, useEffect, useState } from "react";
import EditMeetingRoomForm from "@/app/features/admin/components/meeting-rooms/edit-meeting-room-form";
import { getAmenities } from "@/app/features/amenities/actions/get-amenities";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { getRoomAmenities } from "@/app/features/meeting-rooms/actions/get-room-amenities";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

type EditMeetingRoomSheetProps = Readonly<{
  meetingRoom: MeetingRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

type LoadedData = {
  allAmenities: Tables<"amenities">[];
  currentAmenityIds: string[];
};

export function EditMeetingRoomSheet({
  meetingRoom,
  open,
  onOpenChange,
}: EditMeetingRoomSheetProps) {
  const [loadedData, setLoadedData] = useState<LoadedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load amenities when sheet opens
  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadData() {
      setIsLoading(true);

      const [amenitiesResult, roomAmenitiesResult] = await Promise.all([
        getAmenities(),
        getRoomAmenities(meetingRoom.meeting_room_id),
      ]);

      const allAmenities =
        hasData(amenitiesResult) && !hasError(amenitiesResult)
          ? amenitiesResult.data
          : [];

      const currentAmenityIds =
        hasData(roomAmenitiesResult) && !hasError(roomAmenitiesResult)
          ? roomAmenitiesResult.data.map((a) => a.amenity_id)
          : [];

      setLoadedData({ allAmenities, currentAmenityIds });
      setIsLoading(false);
    }

    loadData();
  }, [open, meetingRoom.meeting_room_id]);

  function handleSuccess() {
    onOpenChange(false);
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <Activity mode={open ? "visible" : "hidden"}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {messages.admin.meetingRooms.ui.update.title}
            </SheetTitle>
            <SheetDescription>
              {messages.admin.meetingRooms.ui.update.description}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {isLoading || !loadedData ? (
              <EditMeetingRoomFormSkeleton />
            ) : (
              <EditMeetingRoomForm
                allAmenities={loadedData.allAmenities}
                currentAmenityIds={loadedData.currentAmenityIds}
                meetingRoom={meetingRoom}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        </SheetContent>
      </Activity>
    </Sheet>
  );
}

function EditMeetingRoomFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Name field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      {/* Capacity field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-40" />
      </div>
      {/* Price field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      {/* Size field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      {/* Amenities */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
      {/* Images */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-32 w-full" />
      </div>
      {/* Button */}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
