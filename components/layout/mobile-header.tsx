"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import { HeaderContent } from "@/components/layout/header-content";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import messages from "@/lib/messages.json";

type MobileHeaderProps = Readonly<{
  isAdmin?: boolean;
  user: UserWithSubscription | null;
}>;

export function MobileHeader({ isAdmin = false, user }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="md:hidden">
      <Sheet onOpenChange={setIsOpen} open={isOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[300px] sm:w-[400px]" side="right">
          <SheetHeader>
            <SheetTitle className="sr-only">
              {messages.header.ui.title}
            </SheetTitle>
            <Image
              alt={messages.header.ui.logoAlt}
              height={100}
              src="/tsh-logo.svg"
              width={150}
            />
          </SheetHeader>
          <HeaderContent
            isAdmin={isAdmin}
            onLinkClick={() => setIsOpen(false)}
            user={user}
            variant="mobile"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
