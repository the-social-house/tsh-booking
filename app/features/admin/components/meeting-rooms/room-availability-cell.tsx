"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteRoomUnavailability } from "@/app/features/admin/actions/delete-room-unavailability";
import { getRoomUnavailabilities } from "@/app/features/admin/actions/get-room-unavailabilities";
import { AddUnavailabilityDialog } from "@/app/features/admin/components/meeting-rooms/add-unavailability-dialog";
import { EditUnavailabilityDialog } from "@/app/features/admin/components/meeting-rooms/edit-unavailability-dialog";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatErrorForToast } from "@/lib/form-errors";
import { formatDate } from "@/lib/format-date-time";
import messages from "@/lib/messages.json";
import { hasData } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

type RoomAvailabilityCellProps = {
  meetingRoom: MeetingRoom;
};

type Unavailability = Tables<"room_unavailabilities">;

export function RoomAvailabilityCell({
  meetingRoom,
}: RoomAvailabilityCellProps) {
  const router = useRouter();
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>(
    (meetingRoom.unavailabilities as Unavailability[]) || []
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUnavailability, setEditingUnavailability] =
    useState<Unavailability | null>(null);

  // Load unavailabilities when component mounts or room changes
  useEffect(() => {
    async function loadUnavailabilities() {
      const result = await getRoomUnavailabilities(meetingRoom.meeting_room_id);
      if (hasData(result)) {
        setUnavailabilities(result.data);
      }
    }
    loadUnavailabilities();
  }, [meetingRoom.meeting_room_id]);

  function handleAddSuccess() {
    setIsAddDialogOpen(false);
    router.refresh();
    // Reload unavailabilities
    async function reloadUnavailabilities() {
      const result = await getRoomUnavailabilities(meetingRoom.meeting_room_id);
      if (hasData(result)) {
        setUnavailabilities(result.data);
      }
    }
    reloadUnavailabilities();
  }

  function handleEditClick(unavailability: Unavailability) {
    setEditingUnavailability(unavailability);
  }

  function handleEditSuccess() {
    setEditingUnavailability(null);
    router.refresh();
    // Reload unavailabilities
    async function reloadUnavailabilities() {
      const result = await getRoomUnavailabilities(meetingRoom.meeting_room_id);
      if (hasData(result)) {
        setUnavailabilities(result.data);
      }
    }
    reloadUnavailabilities();
  }

  async function handleDelete(unavailabilityId: string) {
    const result = await deleteRoomUnavailability(unavailabilityId);

    if (!result.success) {
      toast.error(formatErrorForToast(result.error));
      return;
    }

    toast.success(
      messages.admin.meetingRooms.messages.success.unavailabilityDelete
    );
    router.refresh();
    // Reload unavailabilities
    async function reloadAfterDelete() {
      const reloadResult = await getRoomUnavailabilities(
        meetingRoom.meeting_room_id
      );
      if (hasData(reloadResult)) {
        setUnavailabilities(reloadResult.data);
      }
    }
    reloadAfterDelete();
  }

  // Format date for display helper
  const formatDateForDisplay = (dateStr: string | null | undefined): string => {
    if (!dateStr) {
      return "";
    }
    try {
      const date = new Date(dateStr);
      return formatDate(date);
    } catch {
      return dateStr;
    }
  };

  // Format date range for badge
  const formatDateRange = (unavailability: Unavailability): string => {
    const startDate = formatDateForDisplay(
      unavailability.unavailable_start_date
    );
    const endDate = formatDateForDisplay(unavailability.unavailable_end_date);
    if (startDate === endDate) {
      return startDate;
    }
    return `${startDate} - ${endDate}`;
  };

  return (
    <>
      <div className="flex w-[200px] flex-wrap items-center gap-2">
        {unavailabilities.map((unavailability) => {
          const dateRange = formatDateRange(unavailability);

          return (
            <Tooltip key={unavailability.unavailability_id}>
              <TooltipTrigger asChild>
                <Badge
                  className="cursor-pointer"
                  onClick={() => handleEditClick(unavailability)}
                  variant="outline"
                >
                  {dateRange}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {messages.admin.meetingRooms.ui.availability.badgeTooltip}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className="cursor-pointer"
              onClick={() => setIsAddDialogOpen(true)}
              variant="outline"
            >
              <PlusIcon className="size-3" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{messages.admin.meetingRooms.ui.availability.addButton}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <AddUnavailabilityDialog
        meetingRoomId={meetingRoom.meeting_room_id}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddSuccess}
        open={isAddDialogOpen}
      />
      {editingUnavailability ? (
        <EditUnavailabilityDialog
          meetingRoomId={meetingRoom.meeting_room_id}
          onDelete={handleDelete}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUnavailability(null);
            }
          }}
          onSuccess={handleEditSuccess}
          open={true}
          unavailability={editingUnavailability}
        />
      ) : null}
    </>
  );
}
