"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteAmenity } from "@/app/features/admin/actions/delete-amenity";
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

type DeleteAmenityDialogProps = {
  amenityId: string;
  amenityName: string;
};

export function DeleteAmenityDialog({
  amenityId,
  amenityName,
}: DeleteAmenityDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    const result = await deleteAmenity(amenityId);

    if (!result.success) {
      toast.error(result.error.message, {
        duration: 10_000,
      });
      setIsDeleting(false);
      return;
    }

    toast.success(messages.amenities.messages.success.delete);
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
            {messages.amenities.ui.delete.dialogTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {messages.amenities.ui.delete.dialogDescription}
            <span className="mt-2 block font-medium text-foreground">
              &quot;{amenityName}&quot;
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {messages.amenities.ui.delete.dialogCancel}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              disabled={isDeleting}
              loading={isDeleting}
              loadingText={messages.amenities.ui.delete.dialogConfirmLoading}
              onClick={handleDelete}
              variant="destructive"
            >
              {messages.amenities.ui.delete.dialogConfirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
