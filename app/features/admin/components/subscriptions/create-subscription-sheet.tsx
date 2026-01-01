"use client";

import { PlusIcon } from "lucide-react";
import { Activity, useState } from "react";
import CreateSubscriptionForm from "@/app/features/admin/components/subscriptions/create-subscription-form";
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

export function CreateSubscriptionSheet() {
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          {messages.admin.ui.tabs.subscriptions.addSubscription}
        </Button>
      </SheetTrigger>
      <Activity mode={open ? "visible" : "hidden"}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {messages.admin.subscriptions.ui.create.title}
            </SheetTitle>
            <SheetDescription>
              {messages.admin.subscriptions.ui.create.description}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <CreateSubscriptionForm onSuccess={handleSuccess} />
          </div>
        </SheetContent>
      </Activity>
    </Sheet>
  );
}
