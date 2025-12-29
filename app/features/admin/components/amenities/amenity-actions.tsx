"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { DeleteAmenityDialog } from "@/app/features/admin/components/amenities/delete-amenity-dialog";
import { EditAmenitySheet } from "@/app/features/admin/components/amenities/edit-amenity-sheet";
import type { AdminAmenity } from "@/app/features/amenities/actions/get-amenities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import messages from "@/lib/messages.json";

type AmenityActionsProps = {
  amenity: AdminAmenity;
};

export function AmenityActions({ amenity }: AmenityActionsProps) {
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
          <DeleteAmenityDialog
            amenityId={amenity.amenity_id}
            amenityName={amenity.amenity_name}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <EditAmenitySheet
        amenity={amenity}
        onOpenChange={setEditSheetOpen}
        open={editSheetOpen}
      />
    </>
  );
}
