import { Suspense } from "react";
import { BookingDrawerWrapper } from "@/app/[room]/booking-drawer-wrapper";
import { RoomContent } from "@/app/[room]/room-content";
import { RoomContentSkeleton } from "@/app/[room]/room-content-skeleton";
import { getMeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-room";
import { getRoomAmenities } from "@/app/features/meeting-rooms/actions/get-room-amenities";
import { getUser } from "@/app/features/users/actions/get-user";
import { hasData, hasError } from "@/lib/supabase-response";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;

  // Don't await - pass Promise to enable streaming
  const roomPromise = getMeetingRoom(room);

  // TODO: Replace with actual user session data - for now use user_id: 1
  // When authentication is added, get user_id from session
  const userId = 1;
  const userPromise = getUser(userId);

  return (
    <Suspense fallback={<RoomContentSkeleton />}>
      <RoomContentWrapper roomPromise={roomPromise} userPromise={userPromise} />
    </Suspense>
  );
}

// Wrapper component to handle sequential dependency (amenities need room ID)
async function RoomContentWrapper({
  roomPromise,
  userPromise,
}: {
  roomPromise: ReturnType<typeof getMeetingRoom>;
  userPromise: ReturnType<typeof getUser>;
}) {
  // Await user first (needed for BookingDrawerWrapper)
  const userResult = await userPromise;

  if (hasError(userResult) || !hasData(userResult)) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="font-bold text-2xl">User not found</h1>
        <p className="text-muted-foreground">
          Unable to load user data. Please try again.
        </p>
      </div>
    );
  }

  const user = userResult.data;
  // Await room first to get room ID for amenities
  const roomResult = await roomPromise;

  // If room not found, return early
  if (hasError(roomResult) || !hasData(roomResult)) {
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

  // Don't await amenities - pass Promise for streaming
  const amenitiesPromise = getRoomAmenities(meetingRoom.meeting_room_id);

  // Await amenities for BookingDrawerWrapper (needed immediately for drawer)
  const amenitiesResult = await amenitiesPromise;
  const roomAmenities = hasData(amenitiesResult) ? amenitiesResult.data : [];

  return (
    <>
      <Suspense fallback={<RoomContentSkeleton />}>
        <RoomContent
          amenitiesPromise={amenitiesPromise}
          roomPromise={roomPromise}
        />
      </Suspense>
      <BookingDrawerWrapper
        meetingRoom={meetingRoom}
        roomAmenities={roomAmenities}
        user={{
          user_id: user.user_id,
          user_email: user.user_email,
          subscription_discount: user.subscription_discount_rate,
        }}
      />
    </>
  );
}
