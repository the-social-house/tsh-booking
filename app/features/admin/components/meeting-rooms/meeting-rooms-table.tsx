import { Suspense } from "react";
import { AdminDataTableSkeleton } from "@/app/features/admin/components/admin-data-table";
import { CreateMeetingRoomSheet } from "@/app/features/admin/components/meeting-rooms/create-meeting-room-sheet";
import { meetingRoomsColumns } from "@/app/features/admin/components/meeting-rooms/meeting-rooms-table-columns";
import { MeetingRoomsTableContent } from "@/app/features/admin/components/meeting-rooms/meeting-rooms-table-content";
import TableActionHeader from "@/app/features/admin/components/table-action-header";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";

type MeetingRoomsTableProps = {
  meetingRoomsPromise: Promise<SupabaseResponse<MeetingRoom[]>>;
};

export function MeetingRoomsTable({
  meetingRoomsPromise,
}: MeetingRoomsTableProps) {
  return (
    <>
      <TableActionHeader
        actionSlot={<CreateMeetingRoomSheet />}
        title={messages.admin.meetingRooms.title}
      />
      <Suspense
        fallback={
          <AdminDataTableSkeleton columnCount={meetingRoomsColumns.length} />
        }
      >
        <MeetingRoomsTableContent promise={meetingRoomsPromise} />
      </Suspense>
    </>
  );
}
