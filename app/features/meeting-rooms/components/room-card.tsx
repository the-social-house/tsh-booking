import { Ruler, Users } from "lucide-react";
import Link from "next/link";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { RoomImage } from "@/app/features/meeting-rooms/components/room-image";
import { RoomPrice } from "@/app/features/meeting-rooms/components/room-price";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Heading from "@/components/ui/heading";
import { formatPrice } from "@/lib/format-price";
import messages from "@/lib/messages.json";

type RoomCardProps = Readonly<{
  room: MeetingRoom;
  searchParams?: {
    date?: string;
    startTime?: string;
    endTime?: string;
    people?: string;
  };
  subscriptionDiscountRate: number | null;
  imageAspectRatio: string;
}>;

export function RoomCard({
  room,
  searchParams,
  subscriptionDiscountRate,
  imageAspectRatio = "3/4",
}: RoomCardProps) {
  const images = room.meeting_room_images ?? [];
  const originalPrice = room.meeting_room_price_per_hour;
  const hasDiscount =
    subscriptionDiscountRate !== null && subscriptionDiscountRate > 0;
  const discountRate = hasDiscount ? subscriptionDiscountRate / 100 : 0;
  const memberPrice = originalPrice * (1 - discountRate);

  return (
    <Card className="group overflow-hidden p-0">
      <Carousel className="w-full" opts={{ watchDrag: false, align: "start" }}>
        <CardContent className="px-0">
          {/* Image Carousel */}
          {images.length > 0 && (
            <div className="relative">
              <CarouselContent>
                {images.map((image) => (
                  <CarouselItem key={image}>
                    <RoomImage
                      alt={room.meeting_room_name}
                      className="h-full w-full duration-300 ease-in-out group-hover:scale-101 group-hover:transition-transform"
                      imageAspectRatio={imageAspectRatio}
                      src={image}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* Carousel buttons */}
              {images.length > 1 && (
                <div className="pointer-events-none absolute right-4 bottom-4 z-10 flex justify-end gap-2">
                  <div className="pointer-events-auto">
                    <CarouselPrevious />
                  </div>
                  <div className="pointer-events-auto">
                    <CarouselNext />
                  </div>
                </div>
              )}
            </div>
          )}
          <Link
            href={`/${room.meeting_room_slug}?${new URLSearchParams(searchParams).toString()}`}
          >
            <div className="space-y-4 p-3">
              <div className="space-y-1">
                {/* Room Name */}
                <Heading as="h3" size="h4">
                  {room.meeting_room_name}
                </Heading>
                <div className="flex items-center gap-2">
                  {/* Capacity */}
                  <Badge pill variant="outline">
                    <Users /> 1 - {room.meeting_room_capacity}{" "}
                    {messages.common.words.people}
                  </Badge>
                  {/* Room Size */}
                  <Badge pill variant="outline">
                    <Ruler /> {room.meeting_room_size}{" "}
                    {messages.common.units.squareMeters}
                  </Badge>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-end justify-between gap-4">
                {hasDiscount ? (
                  <>
                    <RoomPrice
                      label={
                        messages.admin.meetingRooms.ui.card.originalPriceLabel
                      }
                      original
                      price={formatPrice(originalPrice)}
                    />
                    <RoomPrice
                      label={
                        messages.admin.meetingRooms.ui.card.memberPriceLabel
                      }
                      price={formatPrice(memberPrice)}
                    />
                  </>
                ) : (
                  <RoomPrice
                    label={messages.admin.meetingRooms.ui.card.priceLabel}
                    price={formatPrice(originalPrice)}
                  />
                )}
              </div>
            </div>
          </Link>
        </CardContent>
      </Carousel>
    </Card>
  );
}
