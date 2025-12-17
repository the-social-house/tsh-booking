"use client";

import { PlusIcon } from "lucide-react";
import { Activity, useState } from "react";
import CreateMeetingRoomForm from "@/app/features/admin/components/meeting-rooms/create-meeting-room-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import messages from "@/lib/messages.json";

export function CreateMeetingRoomSheet() {
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          {messages.admin.meetingRooms.addMeetingRoom}
        </Button>
      </SheetTrigger>
      <Activity mode={open ? "visible" : "hidden"}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {messages.admin.meetingRooms.ui.create.title}
            </SheetTitle>
            <SheetDescription>
              {messages.admin.meetingRooms.ui.create.description}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <CreateMeetingRoomForm onSuccess={handleSuccess} />
          </div>
        </SheetContent>
      </Activity>
    </Sheet>
  );
}
