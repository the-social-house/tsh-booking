"use client";

import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { Badge } from "@/components/ui/badge";
import messages from "@/lib/messages.json";
import type { Tables } from "@/supabase/types/database";

type RoomAmenitiesCellProps = Readonly<{
  meetingRoom: MeetingRoom;
}>;

export function RoomAmenitiesCell({ meetingRoom }: RoomAmenitiesCellProps) {
  // Extract amenities from nested structure: amenities: [{ amenity_id, amenities: {...} }]
  const amenitiesList =
    meetingRoom.amenities
      ?.map((item) => {
        if (item && typeof item === "object" && "amenities" in item) {
          return (
            item as {
              amenity_id: string;
              amenities: Tables<"amenities"> | null;
            }
          ).amenities;
        }
        return null;
      })
      .filter((amenity): amenity is Tables<"amenities"> => amenity !== null) ??
    [];

  if (amenitiesList.length === 0) {
    return (
      <span className="text-muted-foreground text-sm">
        {messages.common.words.none}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {amenitiesList.map((amenity) => (
        <Badge key={amenity.amenity_id} variant="secondary">
          {amenity.amenity_name}
        </Badge>
      ))}
    </div>
  );
}
