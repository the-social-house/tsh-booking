"use client";

import { use } from "react";
import { AdminDataTable } from "@/app/features/admin/components/admin-data-table";
import { meetingRoomsColumns } from "@/app/features/admin/components/meeting-rooms/meeting-rooms-table-columns";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import EmptyFallback from "@/components/ui/empty-fallback";
import ErrorFallback from "@/components/ui/error-fallback";
import messages from "@/lib/messages.json";
import {
  hasData,
  hasError,
  type SupabaseResponse,
} from "@/lib/supabase-response";

type MeetingRoomsTableContentProps = {
  promise: Promise<SupabaseResponse<MeetingRoom[]>>;
};

export function MeetingRoomsTableContent({
  promise,
}: MeetingRoomsTableContentProps) {
  const result = use(promise);

  if (hasError(result)) {
    return (
      <ErrorFallback
        description={messages.admin.ui.tabs.meetingRooms.error}
        title={messages.admin.ui.tabs.meetingRooms.errorTitle}
      />
    );
  }

  if (!hasData(result) || result.data.length === 0) {
    return (
      <EmptyFallback
        description={messages.admin.ui.tabs.meetingRooms.empty}
        title={messages.admin.ui.tabs.meetingRooms.emptyTitle}
      />
    );
  }

  return <AdminDataTable columns={meetingRoomsColumns} data={result.data} />;
}
