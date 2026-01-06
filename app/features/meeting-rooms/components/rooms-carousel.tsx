"use client";

import { use } from "react";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { RoomCard } from "@/app/features/meeting-rooms/components/room-card";
import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import EmptyFallback from "@/components/ui/empty-fallback";
import ErrorFallback from "@/components/ui/error-fallback";
import Heading from "@/components/ui/heading";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";
import { hasData, hasError } from "@/lib/supabase-response";

type RoomsCarouselProps = Readonly<{
  roomsPromise: Promise<SupabaseResponse<MeetingRoom[]>>;
  userPromise: Promise<SupabaseResponse<UserWithSubscription>>;
}>;

export function RoomsCarousel({
  roomsPromise,
  userPromise,
}: RoomsCarouselProps) {
  const roomsResult = use(roomsPromise);
  const userResult = use(userPromise);

  // Check for errors first
  if (hasError(roomsResult)) {
    return (
      <ErrorFallback
        description={messages.admin.meetingRooms.ui.carousel.error}
        title={messages.admin.meetingRooms.ui.carousel.errorTitle}
      />
    );
  }

  // Check for empty data
  if (!hasData(roomsResult) || roomsResult.data.length === 0) {
    return (
      <EmptyFallback
        description={messages.admin.meetingRooms.ui.carousel.empty}
        title={messages.admin.meetingRooms.ui.carousel.emptyTitle}
      />
    );
  }

  const rooms = roomsResult.data;
  const subscriptionDiscountRate = hasData(userResult)
    ? userResult.data.subscription_discount_rate
    : null;

  return (
    <Carousel className="w-full space-y-10">
      <div className="flex items-center justify-between">
        <Heading
          as="h2"
          eyebrow={messages.admin.meetingRooms.ui.carousel.eyebrow}
          size="h1"
        >
          {messages.admin.meetingRooms.ui.carousel.title}
        </Heading>
        <div className="ml-auto flex w-fit gap-2">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </div>
      <CarouselContent className="md:-ml-6">
        {rooms.map((room) => (
          <CarouselItem
            className="basis-[80%] md:basis-[400px] md:pl-6"
            key={room.meeting_room_id}
          >
            <RoomCard
              imageAspectRatio="3/4"
              room={room}
              subscriptionDiscountRate={subscriptionDiscountRate}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
