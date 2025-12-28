"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  Coins,
  DoorOpen,
  Ruler,
  Sparkles,
  Users,
} from "lucide-react";
import { MeetingRoomActions } from "@/app/features/admin/components/meeting-rooms/meeting-room-actions";
import { RoomAmenitiesCell } from "@/app/features/admin/components/meeting-rooms/room-amenities-cell";
import { RoomAvailabilityCell } from "@/app/features/admin/components/meeting-rooms/room-availability-cell";
import { TableHeaderCell } from "@/app/features/admin/components/meeting-rooms/table-header-cell";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import messages from "@/lib/messages.json";

export const meetingRoomsColumns: ColumnDef<MeetingRoom>[] = [
  {
    accessorKey: "meeting_room_name",
    header: () => (
      <TableHeaderCell icon={DoorOpen}>
        {messages.admin.ui.tabs.meetingRooms.table.name}
      </TableHeaderCell>
    ),
  },
  {
    accessorKey: "meeting_room_capacity",
    header: () => (
      <TableHeaderCell icon={Users}>
        {messages.admin.ui.tabs.meetingRooms.table.capacity}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const capacity = row.getValue("meeting_room_capacity") as number;
      return `${capacity} ${messages.common.words.people}`;
    },
  },
  {
    accessorKey: "meeting_room_size",
    header: () => (
      <TableHeaderCell icon={Ruler}>
        {messages.admin.ui.tabs.meetingRooms.table.size}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const size = row.getValue("meeting_room_size") as number;
      return `${size} ${messages.common.units.squareMeters}`;
    },
  },
  {
    accessorKey: "meeting_room_price_per_hour",
    header: () => (
      <TableHeaderCell icon={Coins}>
        {messages.admin.ui.tabs.meetingRooms.table.hourlyRate}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const price = row.getValue("meeting_room_price_per_hour") as number;
      return `${price} ${messages.common.units.hourlyRate}`;
    },
  },
  {
    id: "amenities",
    header: () => (
      <TableHeaderCell icon={Sparkles}>
        {messages.admin.ui.tabs.meetingRooms.table.amenities}
      </TableHeaderCell>
    ),
    cell: ({ row }) => <RoomAmenitiesCell meetingRoom={row.original} />,
  },
  {
    id: "availability",
    header: () => (
      <TableHeaderCell icon={CheckCircle2}>
        {messages.admin.ui.tabs.meetingRooms.table.availability}
      </TableHeaderCell>
    ),
    cell: ({ row }) => <RoomAvailabilityCell meetingRoom={row.original} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <MeetingRoomActions meetingRoom={row.original} />,
  },
];
