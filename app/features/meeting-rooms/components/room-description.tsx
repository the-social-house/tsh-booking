import type { RoomAmenity } from "@/app/features/meeting-rooms/actions/get-room-amenities";
import { cn } from "@/lib/utils";
import type { Tables } from "@/supabase/types/database";

type RoomDescriptionProps = {
  /**
   * Meeting room data
   */
  room: Tables<"meeting_rooms">;
  /**
   * Room amenities
   */
  amenities: RoomAmenity[];
  /**
   * Additional className for styling
   */
  className?: string;
};

/**
 * Room description component displaying room details.
 * Shows room name, capacity, size, and price information.
 */
export function RoomDescription({
  amenities,
  room,
  className,
}: RoomDescriptionProps) {
  const meetingRoomOf = room.meeting_room_name.split(" of ")[1];
  const specifications = [
    {
      label: "Size",
      value: `${room.meeting_room_size}m²`,
    },
    {
      label: "Capacity",
      value: `${room.meeting_room_capacity} people`,
    },
    {
      label: "Price",
      value: `${room.meeting_room_price_per_hour.toFixed(2)} DKK/hour`,
    },
  ];
  return (
    <div className={cn(className, "flex flex-col gap-8")}>
      <div className="flex flex-col items-start justify-between gap-4 min-[949px]:flex-row min-[949px]:items-center">
        <div className="flex flex-col items-start gap-2">
          <span className="text-muted-foreground text-sm">Room of</span>
          <h1 className="font-bold text-3xl uppercase">{meetingRoomOf}</h1>
        </div>
        <div className="flex flex-row items-start gap-2 md:flex-col min-[949px]:items-end">
          {specifications.map((specification, index) => (
            <span className="flex items-center gap-2" key={specification.label}>
              {specification.value}
              {index < specifications.length - 1 && (
                <span className="md:hidden">|</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Placeholder for room description - will be added to DB schema later */}
      <div className="text-muted-foreground">
        <p>
          This modern meeting room is perfect for your next collaboration
          session. Equipped with all the amenities you need for a productive
          meeting.
        </p>
      </div>
      <div className="mt-4 flex w-fit min-w-full flex-col items-start gap-2 rounded-md bg-muted p-4 md:min-w-2/3">
        <h3 className="font-bold text-lg">Amenities</h3>
        <div className="flex flex-col items-start gap-2">
          {amenities.map((amenity) => (
            <div key={amenity.amenity_id}>
              {amenity.amenity_name},{" "}
              {amenity.amenity_price
                ? `+ ${amenity.amenity_price.toFixed(2)} DKK`
                : "Free"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
