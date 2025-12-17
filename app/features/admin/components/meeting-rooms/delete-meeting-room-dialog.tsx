"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteMeetingRoom } from "@/app/features/admin/actions/delete-meeting-room";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import messages from "@/lib/messages.json";

type DeleteMeetingRoomDialogProps = {
  meetingRoomId: number;
  meetingRoomName: string;
};

export function DeleteMeetingRoomDialog({
  meetingRoomId,
  meetingRoomName,
}: DeleteMeetingRoomDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    const result = await deleteMeetingRoom(meetingRoomId);

    if (!result.success) {
      toast.error(result.error.message, {
        duration: 10_000,
      });
      setIsDeleting(false);
      return;
    }

    toast.success(messages.admin.meetingRooms.messages.success.delete);
    setIsOpen(false);
    setIsDeleting(false);
    router.refresh();
  }

  return (
    <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {messages.common.buttons.delete}
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {messages.admin.meetingRooms.ui.delete.dialogTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {messages.admin.meetingRooms.ui.delete.dialogDescription}
            <span className="mt-2 block font-medium text-foreground">
              &quot;{meetingRoomName}&quot;
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {messages.admin.meetingRooms.ui.delete.dialogCancel}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              disabled={isDeleting}
              loading={isDeleting}
              loadingText={
                messages.admin.meetingRooms.ui.delete.dialogConfirmLoading
              }
              onClick={handleDelete}
              variant="destructive"
            >
              {messages.admin.meetingRooms.ui.delete.dialogConfirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
