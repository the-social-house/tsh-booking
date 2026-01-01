"use client";

import { Activity } from "react";
import EditSubscriptionForm from "@/app/features/admin/components/subscriptions/edit-subscription-form";
import type { Subscription } from "@/app/features/admin/lib/subscription.schema";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import messages from "@/lib/messages.json";

type EditSubscriptionSheetProps = Readonly<{
  subscription: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

export function EditSubscriptionSheet({
  subscription,
  open,
  onOpenChange,
}: EditSubscriptionSheetProps) {
  function handleSuccess() {
    onOpenChange(false);
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <Activity mode={open ? "visible" : "hidden"}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {messages.admin.subscriptions.ui.update.title}
            </SheetTitle>
            <SheetDescription>
              {messages.admin.subscriptions.ui.update.description}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <EditSubscriptionForm
              onSuccess={handleSuccess}
              subscription_discount_rate={
                subscription.subscription_discount_rate
              }
              subscription_id={subscription.subscription_id}
              subscription_max_monthly_bookings={
                subscription.subscription_max_monthly_bookings
              }
              subscription_monthly_price={
                subscription.subscription_monthly_price
              }
              subscription_name={subscription.subscription_name}
            />
          </div>
        </SheetContent>
      </Activity>
    </Sheet>
  );
}
