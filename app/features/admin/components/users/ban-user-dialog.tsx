"use client";

import { Ban, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { banUnbanUser } from "@/app/features/admin/actions/ban-unban-user";
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
import { formatErrorForToast } from "@/lib/form-errors";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";

type BanUserDialogProps = Readonly<{
  userId: string;
  banned: boolean;
}>;

export function BanUserDialog({ userId, banned }: BanUserDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleBanUnban() {
    setIsProcessing(true);

    const result = await banUnbanUser(userId, !banned);

    if (hasError(result)) {
      toast.error(formatErrorForToast(result.error));
      setIsProcessing(false);
      return;
    }

    if (hasData(result)) {
      toast.success(
        banned
          ? messages.admin.ui.tabs.users.actions.unbanSuccess
          : messages.admin.ui.tabs.users.actions.banSuccess
      );
      setIsOpen(false);
      setIsProcessing(false);
      router.refresh();
    } else {
      toast.error(
        banned
          ? messages.admin.ui.tabs.users.actions.unbanError
          : messages.admin.ui.tabs.users.actions.banError
      );
      setIsProcessing(false);
    }
  }

  return (
    <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {banned ? (
            <>
              <Unlock className="h-4 w-4" />
              {messages.admin.ui.tabs.users.actions.unban}
            </>
          ) : (
            <>
              <Ban className="h-4 w-4" />
              {messages.admin.ui.tabs.users.actions.ban}
            </>
          )}
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {banned
              ? messages.admin.ui.tabs.users.ban.dialogUnbanTitle
              : messages.admin.ui.tabs.users.ban.dialogBanTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {banned
              ? messages.admin.ui.tabs.users.ban.dialogUnbanDescription
              : messages.admin.ui.tabs.users.ban.dialogBanDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>
            {messages.admin.ui.tabs.users.ban.dialogCancel}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              disabled={isProcessing}
              loading={isProcessing}
              loadingText={
                banned
                  ? messages.admin.ui.tabs.users.ban.dialogUnbanConfirmLoading
                  : messages.admin.ui.tabs.users.ban.dialogBanConfirmLoading
              }
              onClick={handleBanUnban}
              variant={banned ? "default" : "destructive"}
            >
              {banned
                ? messages.admin.ui.tabs.users.ban.dialogUnbanConfirm
                : messages.admin.ui.tabs.users.ban.dialogBanConfirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
