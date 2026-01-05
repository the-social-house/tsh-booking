import type { RoomAmenity } from "@/app/features/meeting-rooms/actions/get-room-amenities";
import { Badge } from "@/components/ui/badge";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format-price";
import messages from "@/lib/messages.json";
import { cn } from "@/lib/utils";
import type { Tables } from "@/supabase/types/database";

type RoomDescriptionProps = Readonly<{
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
}>;

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
      label: messages.admin.meetingRooms.ui.description.size,
      value: `${room.meeting_room_size} ${messages.common.units.squareMeters}`,
    },
    {
      label: messages.admin.meetingRooms.ui.description.capacity,
      value: `${room.meeting_room_capacity} ${messages.common.words.people}`,
    },
    {
      label: messages.admin.meetingRooms.ui.description.price,
      value: `${formatPrice(room.meeting_room_price_per_hour)} ${messages.common.units.dkk}/hour`,
    },
  ];
  return (
    <div className={cn(className, "flex flex-col gap-8")}>
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
        <Heading
          as="h1"
          eyebrow={messages.admin.meetingRooms.ui.description.roomOf}
          size="h1"
        >
          {meetingRoomOf}
        </Heading>
        <div className="flex flex-row flex-wrap gap-2 md:flex-col md:items-end md:justify-end">
          {specifications.map((specification) => (
            <Badge
              className="text-xs md:text-sm"
              key={specification.label}
              pill
              variant="outline"
            >
              {specification.label} - {specification.value}
            </Badge>
          ))}
        </div>
      </div>
      <Separator />
      {/* Room description */}
      {room.meeting_room_description ? (
        <div className="whitespace-pre-wrap text-muted-foreground">
          {room.meeting_room_description}
        </div>
      ) : null}
      <Separator />
      <div className="space-y-2">
        <Heading as="h2" size="h2">
          {messages.amenities.ui.list.title}
        </Heading>
        <ul className="space-y-2 md:space-y-4">
          {amenities.map((amenity) => (
            <li className="flex items-center gap-2" key={amenity.amenity_id}>
              <span className="text-sm">{amenity.amenity_name}</span>
              <Badge pill variant="outline">
                {amenity.amenity_price
                  ? `+ ${formatPrice(amenity.amenity_price)} ${messages.common.units.dkk}`
                  : messages.common.words.free}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
