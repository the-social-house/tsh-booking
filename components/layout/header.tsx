"use client";

import {
  CalendarIcon,
  CheckCircle2,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "@/app/features/auth/actions/sign-out";
import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import messages from "@/lib/messages.json";
import { Button } from "../ui/button";

type HeaderProps = Readonly<{
  user: UserWithSubscription | null;
}>;

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const result = await signOut();

    if (result.error) {
      toast.error(messages.header.messages.error.signOutFailed);
      setIsSigningOut(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 h-(--header-height) border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/">
          <Image
            alt={messages.header.ui.logoAlt}
            height={100}
            src="/tsh-logo.svg"
            width={200}
          />
        </Link>
        {user ? (
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-fit px-1.5 hover:bg-muted" variant="ghost">
                  <div className="flex flex-1 flex-col items-start text-left">
                    <span className="font-medium text-sm">
                      {user.user_company_name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {user.user_email}
                    </span>
                  </div>
                  <ChevronsUpDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{messages.header.ui.menu}</DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <CalendarIcon className="mr-2 size-4" />
                  <span>{messages.header.ui.myBookings}</span>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <CheckCircle2 className="mr-2 size-4" />
                    <span>{messages.header.ui.account}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  variant="destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>
                    {isSigningOut
                      ? messages.header.ui.signingOut
                      : messages.header.ui.logOut}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
    </header>
  );
}
