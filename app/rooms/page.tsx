import type { Metadata } from "next";
import { Suspense } from "react";
import { getMeetingRooms } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { getCurrentUserData } from "@/app/features/users/actions/get-current-user-data";
import { RoomsContent } from "@/app/rooms/rooms-list";
import { RoomsContentSkeleton } from "@/app/rooms/rooms-list-skeleton";
import messages from "@/lib/messages.json";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata(
  messages.metadata.rooms.title,
  messages.metadata.rooms.description
);

type RoomsPageProps = Readonly<{
  searchParams: Promise<{
    date?: string;
    startTime?: string;
    endTime?: string;
    people?: string;
  }>;
}>;

export default async function RoomsPage({ searchParams }: RoomsPageProps) {
  const params = await searchParams;
  const meetingRoomsPromise = getMeetingRooms();
  const userPromise = getCurrentUserData();

  return (
    <Suspense fallback={<RoomsContentSkeleton />}>
      <RoomsContent
        meetingRoomsPromise={meetingRoomsPromise}
        searchParams={params}
        userPromise={userPromise}
      />
    </Suspense>
  );
}
