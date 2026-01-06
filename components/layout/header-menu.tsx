"use client";

import {
  CalendarIcon,
  CheckCircle2,
  ChevronsUpDown,
  LogOut,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "@/app/features/auth/actions/sign-out";
import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import messages from "@/lib/messages.json";

type HeaderMenuProps = Readonly<{
  isAdmin?: boolean;
  user: UserWithSubscription;
}>;

export function HeaderMenu({ isAdmin = false, user }: HeaderMenuProps) {
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

        <DropdownMenuItem asChild>
          <Link href="/my-bookings">
            <CalendarIcon className="mr-2 size-4" />
            <span>{messages.header.ui.myBookings}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <CheckCircle2 className="mr-2 size-4" />
            <span>{messages.header.ui.account}</span>
          </Link>
        </DropdownMenuItem>

        {isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield className="mr-2 size-4" />
                <span>{messages.header.ui.adminPanel}</span>
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

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
  );
}
