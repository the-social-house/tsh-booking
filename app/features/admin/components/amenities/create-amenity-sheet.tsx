"use client";

import { PlusIcon } from "lucide-react";
import { Activity, useState } from "react";
import CreateAmenityForm from "@/app/features/admin/components/amenities/create-amenity-form";
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

export function CreateAmenitySheet() {
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          {messages.admin.ui.tabs.amenities.addAmenity}
        </Button>
      </SheetTrigger>
      <Activity mode={open ? "visible" : "hidden"}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{messages.amenities.ui.create.title}</SheetTitle>
            <SheetDescription>
              {messages.amenities.ui.create.description}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <CreateAmenityForm onSuccess={handleSuccess} />
          </div>
        </SheetContent>
      </Activity>
    </Sheet>
  );
}
