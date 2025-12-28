"use client";

import { Activity } from "react";
import EditAmenityForm from "@/app/features/admin/components/amenities/edit-amenity-form";
import type { AdminAmenity } from "@/app/features/amenities/actions/get-amenities";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import messages from "@/lib/messages.json";

type EditAmenitySheetProps = {
  amenity: AdminAmenity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditAmenitySheet({
  amenity,
  open,
  onOpenChange,
}: EditAmenitySheetProps) {
  function handleSuccess() {
    onOpenChange(false);
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <Activity mode={open ? "visible" : "hidden"}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{messages.amenities.ui.update.title}</SheetTitle>
            <SheetDescription>
              {messages.amenities.ui.update.description}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <EditAmenityForm
              amenity_id={amenity.amenity_id}
              amenity_name={amenity.amenity_name}
              amenity_price={amenity.amenity_price}
              onSuccess={handleSuccess}
            />
          </div>
        </SheetContent>
      </Activity>
    </Sheet>
  );
}
