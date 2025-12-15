import { getMeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-room";
import { RoomDescription } from "@/app/features/meeting-rooms/components/room-description";
import { RoomImage } from "@/app/features/meeting-rooms/components/room-image";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import { hasData, hasError } from "@/lib/supabase-response";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;

  // Fetch room from database
  const roomResult = await getMeetingRoom(room);

  if (hasError(roomResult) || !hasData(roomResult)) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="font-bold text-2xl">Room not found</h1>
        <p className="text-muted-foreground">
          The room &quot;{room}&quot; does not exist.
        </p>
      </div>
    );
  }

  const meetingRoom = roomResult.data;

  return (
    <div className="w-full overflow-x-hidden py-8">
      <div className="container mx-auto px-4">
        <TwoColumnLayout
          left={<RoomDescription room={meetingRoom} />}
          leftFraction={2}
          right={
            <div className="space-y-4">
              <RoomImage roomId={meetingRoom.meeting_room_id} />
              <RoomImage roomId={meetingRoom.meeting_room_id} />
            </div>
          }
          rightFraction={3}
        />
      </div>
    </div>
  );
}
