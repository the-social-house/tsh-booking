"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { DeleteMeetingRoomDialog } from "@/app/features/admin/components/meeting-rooms/delete-meeting-room-dialog";
import { EditMeetingRoomSheet } from "@/app/features/admin/components/meeting-rooms/edit-meeting-room-sheet";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import messages from "@/lib/messages.json";

type MeetingRoomActionsProps = {
  meetingRoom: MeetingRoom;
};

export function MeetingRoomActions({ meetingRoom }: MeetingRoomActionsProps) {
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="ghost">
            <span className="sr-only">{messages.admin.ui.table.actions}</span>
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditSheetOpen(true)}>
            {messages.common.buttons.edit}
          </DropdownMenuItem>
          <DeleteMeetingRoomDialog
            meetingRoomId={meetingRoom.meeting_room_id}
            meetingRoomName={meetingRoom.meeting_room_name}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <EditMeetingRoomSheet
        meetingRoom={meetingRoom}
        onOpenChange={setEditSheetOpen}
        open={editSheetOpen}
      />
    </>
  );
}
