"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { DeleteSubscriptionDialog } from "@/app/features/admin/components/subscriptions/delete-subscription-dialog";
import { EditSubscriptionSheet } from "@/app/features/admin/components/subscriptions/edit-subscription-sheet";
import type { Subscription } from "@/app/features/admin/lib/subscription.schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import messages from "@/lib/messages.json";

type SubscriptionActionsProps = Readonly<{
  subscription: Subscription;
}>;

export function SubscriptionActions({
  subscription,
}: SubscriptionActionsProps) {
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
          <DeleteSubscriptionDialog
            subscriptionId={subscription.subscription_id}
            subscriptionName={subscription.subscription_name}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <EditSubscriptionSheet
        onOpenChange={setEditSheetOpen}
        open={editSheetOpen}
        subscription={subscription}
      />
    </>
  );
}
