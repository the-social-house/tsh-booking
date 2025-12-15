import type { Tables } from "@/supabase/types/database";

type RoomDescriptionProps = {
  /**
   * Meeting room data
   */
  room: Tables<"meeting_rooms">;
  /**
   * Additional className for styling
   */
  className?: string;
};

/**
 * Room description component displaying room details.
 * Shows room name, capacity, size, and price information.
 */
export function RoomDescription({ room, className }: RoomDescriptionProps) {
  return (
    <div className={className}>
      <h1 className="mb-4 font-bold text-3xl">{room.meeting_room_name}</h1>

      <div className="mb-6 space-y-2 text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Capacity:</span>{" "}
          {room.meeting_room_capacity} people
        </p>
        <p>
          <span className="font-medium text-foreground">Size:</span>{" "}
          {room.meeting_room_size}m²
        </p>
        <p>
          <span className="font-medium text-foreground">Price:</span>{" "}
          {room.meeting_room_price_per_hour.toFixed(2)} DKK/hour
        </p>
      </div>

      {/* Placeholder for room description - will be added to DB schema later */}
      <div className="text-muted-foreground">
        <p>
          This modern meeting room is perfect for your next collaboration
          session. Equipped with all the amenities you need for a productive
          meeting.
        </p>
      </div>
    </div>
  );
}
