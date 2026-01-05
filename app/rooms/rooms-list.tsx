"use client";

import { use, useEffect, useMemo, useState } from "react";
import { checkRoomAvailability } from "@/app/features/meeting-rooms/actions/check-room-availability";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { RoomCard } from "@/app/features/meeting-rooms/components/room-card";
import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import { RoomsContentSkeleton } from "@/app/rooms/rooms-list-skeleton";
import EmptyFallback from "@/components/ui/empty-fallback";
import ErrorFallback from "@/components/ui/error-fallback";
import Heading from "@/components/ui/heading";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";
import { hasData, hasError } from "@/lib/supabase-response";

type RoomsContentProps = Readonly<{
  meetingRoomsPromise: Promise<SupabaseResponse<MeetingRoom[]>>;
  userPromise: Promise<SupabaseResponse<UserWithSubscription>>;
  searchParams: {
    date?: string;
    startTime?: string;
    endTime?: string;
    people?: string;
  };
}>;

export function RoomsContent({
  meetingRoomsPromise,
  userPromise,
  searchParams,
}: RoomsContentProps) {
  const roomsResult = use(meetingRoomsPromise);
  const userResult = use(userPromise);
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, boolean>>(
    new Map()
  );
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Get rooms data (safe to access after checking errors)
  const allRooms = hasData(roomsResult) ? roomsResult.data : [];
  const subscriptionDiscountRate = hasData(userResult)
    ? userResult.data.subscription_discount_rate || 0
    : 0;

  // Determine if we're showing search results
  const hasSearchParams =
    searchParams.date ||
    searchParams.startTime ||
    searchParams.endTime ||
    searchParams.people;
  const pageTitle = hasSearchParams
    ? messages.rooms.ui.searchedTitle
    : messages.rooms.ui.title;

  // Filter rooms based on search criteria (must be before early returns)
  const filteredRooms = useMemo(() => {
    let filtered = [...allRooms];

    // Filter by capacity
    if (searchParams.people) {
      const numberOfPeople = Number.parseInt(searchParams.people, 10);
      if (!Number.isNaN(numberOfPeople)) {
        filtered = filtered.filter(
          (room) => room.meeting_room_capacity >= numberOfPeople
        );
      }
    }

    // Filter by availability (if time range is provided)
    if (searchParams.date && searchParams.startTime && searchParams.endTime) {
      // First, filter by unavailabilities (quick check)
      const searchDate = searchParams.date;
      filtered = filtered.filter((room) => {
        // Check if room has unavailabilities for this date
        if (room.unavailabilities && room.unavailabilities.length > 0) {
          const isUnavailable = room.unavailabilities.some((unavailability) => {
            const startDate = new Date(unavailability.unavailable_start_date);
            const endDate = new Date(unavailability.unavailable_end_date);
            const searchDateObj = new Date(searchDate);
            return searchDateObj >= startDate && searchDateObj <= endDate;
          });
          if (isUnavailable) {
            return false;
          }
        }
        return true;
      });

      // Then filter by availability map (booking conflicts)
      if (availabilityMap.size > 0) {
        filtered = filtered.filter((room) => {
          const isAvailable = availabilityMap.get(room.meeting_room_id);
          return isAvailable !== false; // Default to true if not checked yet
        });
      }
    }

    return filtered;
  }, [allRooms, searchParams, availabilityMap]);

  // Check availability for all rooms when search params change
  useEffect(() => {
    if (!(hasData(roomsResult) && searchParams.date)) {
      return;
    }

    // Only check availability if time range is provided
    if (!(searchParams.startTime && searchParams.endTime)) {
      return;
    }

    setIsCheckingAvailability(true);
    const newAvailabilityMap = new Map<string, boolean>();

    // Check availability for each room
    const checkPromises = roomsResult.data.map(async (room) => {
      const result = await checkRoomAvailability({
        roomId: room.meeting_room_id,
        date: searchParams.date ?? "",
        startTime: searchParams.startTime,
        endTime: searchParams.endTime,
      });
      newAvailabilityMap.set(room.meeting_room_id, result.available);
    });

    Promise.all(checkPromises).then(() => {
      setAvailabilityMap(newAvailabilityMap);
      setIsCheckingAvailability(false);
    });
  }, [
    roomsResult,
    searchParams.date,
    searchParams.startTime,
    searchParams.endTime,
  ]);

  // Check for errors first
  if (hasError(roomsResult)) {
    return (
      <div className="container mx-auto">
        <ErrorFallback
          description={messages.rooms.ui.error}
          title={messages.rooms.ui.errorTitle}
        />
      </div>
    );
  }

  // Check for empty data
  if (!hasData(roomsResult) || roomsResult.data.length === 0) {
    return (
      <div className="container mx-auto">
        <EmptyFallback
          description={messages.rooms.ui.empty}
          title={messages.rooms.ui.emptyTitle}
        />
      </div>
    );
  }

  // Show skeleton while checking availability
  if (isCheckingAvailability) {
    return <RoomsContentSkeleton />;
  }

  // Show filtered results
  if (filteredRooms.length === 0) {
    return (
      <div className="container mx-auto">
        <Heading as="h1" className="mb-8" size="h1">
          {pageTitle}
        </Heading>
        <EmptyFallback
          description={messages.rooms.ui.empty}
          title={messages.rooms.ui.emptyTitle}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <Heading as="h1" className="mb-8" size="h1">
        {pageTitle}
      </Heading>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => (
          <RoomCard
            imageAspectRatio="16/9"
            key={room.meeting_room_id}
            room={room}
            subscriptionDiscountRate={subscriptionDiscountRate}
          />
        ))}
      </div>
    </div>
  );
}
