"use client";

import { MoreHorizontalIcon } from "lucide-react";
import type { AdminUser } from "@/app/features/admin/actions/get-all-users-admin";
import { BanUserDialog } from "@/app/features/admin/components/users/ban-user-dialog";
import { UpdateSubscriptionDialog } from "@/app/features/admin/components/users/update-subscription-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import messages from "@/lib/messages.json";

type UserActionsProps = Readonly<{
  user: AdminUser;
}>;

export function UserActions({ user }: UserActionsProps) {
  const isBanned = user.user_is_banned ?? false;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 w-8 p-0" variant="ghost">
          <span className="sr-only">{messages.admin.ui.table.actions}</span>
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isBanned ? (
          <BanUserDialog banned={true} userId={user.user_id} />
        ) : (
          <BanUserDialog banned={false} userId={user.user_id} />
        )}
        <DropdownMenuSeparator />
        <UpdateSubscriptionDialog user={user} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
