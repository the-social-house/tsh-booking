"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import messages from "@/lib/messages.json";

export const meetingRoomsColumns: ColumnDef<MeetingRoom>[] = [
  {
    accessorKey: "meeting_room_name",
    header: messages.admin.ui.tabs.meetingRooms.table.name,
  },
  {
    accessorKey: "meeting_room_capacity",
    header: messages.admin.ui.tabs.meetingRooms.table.capacity,
    cell: ({ row }) => {
      const capacity = row.getValue("meeting_room_capacity") as number;
      return `${capacity} ${messages.common.words.people}`;
    },
  },
  {
    accessorKey: "meeting_room_size",
    header: messages.admin.ui.tabs.meetingRooms.table.size,
    cell: ({ row }) => {
      const size = row.getValue("meeting_room_size") as number;
      return `${size} ${messages.common.units.squareMeters}`;
    },
  },
  {
    accessorKey: "meeting_room_price_per_hour",
    header: messages.admin.ui.tabs.meetingRooms.table.hourlyRate,
    cell: ({ row }) => {
      const price = row.getValue("meeting_room_price_per_hour") as number;
      return `${price} ${messages.common.units.hourlyRate}`;
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="ghost">
            <span className="sr-only">{messages.admin.ui.table.actions}</span>
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>{messages.common.buttons.edit}</DropdownMenuItem>
          <DropdownMenuItem>{messages.common.buttons.delete}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
