import { Suspense } from "react";
import { BookingDrawerWrapper } from "@/app/[room]/booking-drawer-wrapper";
import { RoomContent } from "@/app/[room]/room-content";
import { RoomContentSkeleton } from "@/app/[room]/room-content-skeleton";
import { getMeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-room";
import { getRoomAmenities } from "@/app/features/meeting-rooms/actions/get-room-amenities";
import { getCurrentUserData } from "@/app/features/users/actions/get-current-user-data";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;

  // Don't await - pass Promise to enable streaming
  const roomPromise = getMeetingRoom(room);

  // Get current authenticated user's data from public.users
  const userPromise = getCurrentUserData();

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
  userPromise: ReturnType<typeof getCurrentUserData>;
}) {
  // Await user first (needed for BookingDrawerWrapper)
  const userResult = await userPromise;

  if (hasError(userResult) || !hasData(userResult)) {
    const errorCode = userResult.error?.code;

    let errorMessage: string;
    let errorTitle: string;

    if (errorCode === "UNAUTHENTICATED") {
      errorTitle = messages.common.messages.authenticationRequired;
      errorMessage = messages.common.messages.pleaseLogIn;
    } else if (errorCode === "PGRST116") {
      errorTitle = messages.common.messages.userNotFound;
      errorMessage = messages.common.messages.userProfileNotSetUp;
    } else {
      errorTitle = messages.common.messages.userNotFound;
      errorMessage = messages.common.messages.unableToLoadUserData;
    }

    return (
      <div className="container mx-auto">
        <h1 className="font-bold text-2xl">{errorTitle}</h1>
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>
    );
  }

  const user = userResult.data;
  // Await room first to get room ID for amenities
  const roomResult = await roomPromise;

  // If room not found, return early
  if (hasError(roomResult) || !hasData(roomResult)) {
    return (
      <div className="container mx-auto">
        <h1 className="font-bold text-2xl">
          {messages.common.messages.roomNotFound}
        </h1>
        <p className="text-muted-foreground">
          {messages.common.messages.roomDoesNotExist}
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
