"use client";

import {
  CalendarIcon,
  CheckCircle2,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "@/app/features/auth/actions/sign-out";
import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderProps = {
  user: UserWithSubscription | null;
};

function getInitials(companyName: string): string {
  return companyName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const result = await signOut();

    if (result.error) {
      toast.error("Failed to sign out. Please try again.");
      setIsSigningOut(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  const userAvatarUrl = undefined; // TODO: Add avatar URL when available
  const userInitials = user ? getInitials(user.user_company_name) : "";

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a className="flex items-center gap-2" href="/">
          <h1 className="font-semibold text-lg">The Social House Booking</h1>
        </a>
        {user ? (
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-accent"
                  type="button"
                >
                  <Avatar>
                    <AvatarImage
                      alt={user.user_company_name}
                      src={userAvatarUrl}
                    />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start text-left">
                    <span className="font-medium text-sm">
                      {user.user_company_name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {user.user_email}
                    </span>
                  </div>
                  <ChevronsUpDown className="size-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="font-medium text-sm">
                      {user.user_company_name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {user.user_email}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <CalendarIcon className="mr-2 size-4" />
                  <span>My Bookings</span>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <CheckCircle2 className="mr-2 size-4" />
                    <span>Account</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  variant="destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>{isSigningOut ? "Signing out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
    </header>
  );
}
