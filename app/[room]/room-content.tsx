"use client";

import { use } from "react";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-room";
import type { RoomAmenity } from "@/app/features/meeting-rooms/actions/get-room-amenities";
import { RoomDescription } from "@/app/features/meeting-rooms/components/room-description";
import { RoomImage } from "@/app/features/meeting-rooms/components/room-image";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import type { SupabaseResponse } from "@/lib/supabase-response";
import { hasData, hasError } from "@/lib/supabase-response";

type RoomContentProps = {
  roomPromise: Promise<SupabaseResponse<MeetingRoom>>;
  amenitiesPromise: Promise<SupabaseResponse<RoomAmenity[]>>;
};

export function RoomContent({
  roomPromise,
  amenitiesPromise,
}: RoomContentProps) {
  // Unwrap room promise
  const roomResult = use(roomPromise);

  // Check for errors first
  if (hasError(roomResult)) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="font-bold text-2xl">Error loading room</h1>
        <p className="text-muted-foreground">{roomResult.error.message}</p>
      </div>
    );
  }

  if (!hasData(roomResult)) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="font-bold text-2xl">Room not found</h1>
        <p className="text-muted-foreground">
          The requested room does not exist.
        </p>
      </div>
    );
  }

  const meetingRoom = roomResult.data;

  return (
    <RoomContentWithAmenities
      amenitiesPromise={amenitiesPromise}
      meetingRoom={meetingRoom}
    />
  );
}

type RoomContentWithAmenitiesProps = {
  meetingRoom: MeetingRoom;
  amenitiesPromise: Promise<SupabaseResponse<RoomAmenity[]>>;
};

function RoomContentWithAmenities({
  meetingRoom,
  amenitiesPromise,
}: RoomContentWithAmenitiesProps) {
  // Unwrap amenities promise
  const amenitiesResult = use(amenitiesPromise);

  // Handle amenities errors (non-critical, can show empty list)
  const roomAmenities = hasData(amenitiesResult) ? amenitiesResult.data : [];

  const meetingRoomImages = meetingRoom.meeting_room_images ?? [];

  console.log(meetingRoomImages);

  return (
    <TwoColumnLayout
      left={<RoomDescription amenities={roomAmenities} room={meetingRoom} />}
      leftClassName="md:sticky md:top-0 md:self-start"
      right={
        <div className="space-y-4">
          {meetingRoomImages.map((image) => (
            <RoomImage
              key={image}
              roomId={meetingRoom.meeting_room_id}
              src={image}
            />
          ))}
        </div>
      }
      variant="left-narrow"
    />
  );
}
