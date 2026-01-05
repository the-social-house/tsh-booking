"use client";

import { PlusIcon } from "lucide-react";
import { Activity, useState } from "react";
import CreateInviteForm from "@/app/features/admin/components/users/create-invite-form";
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
import type { Tables } from "@/supabase/types/database";

type CreateInviteSheetProps = Readonly<{
  roles: Tables<"roles">[];
  subscriptions: Tables<"subscriptions">[];
}>;

/**
 * Sheet component wrapper for creating user invites
 *
 * Receives roles and subscriptions as props (fetched on server side).
 * Uses Activity component to only render form when sheet is open (performance).
 */
export function CreateInviteSheet({
  roles,
  subscriptions,
}: CreateInviteSheetProps) {
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          {messages.admin.ui.tabs.users.invite.ui.create.button}
        </Button>
      </SheetTrigger>
      <Activity mode={open ? "visible" : "hidden"}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {messages.admin.ui.tabs.users.invite.ui.create.title}
            </SheetTitle>
            <SheetDescription>
              {messages.admin.ui.tabs.users.invite.ui.create.description}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <CreateInviteForm
              onSuccess={handleSuccess}
              roles={roles}
              subscriptions={subscriptions}
            />
          </div>
        </SheetContent>
      </Activity>
    </Sheet>
  );
}
