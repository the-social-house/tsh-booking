"use client";

import Link from "next/link";
import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import { HeaderMenu } from "@/components/layout/header-menu";
import { HeaderSearchBar } from "@/components/layout/header-search-bar";
import messages from "@/lib/messages.json";

type HeaderContentProps = Readonly<{
  isAdmin?: boolean;
  onLinkClick?: () => void;
  user: UserWithSubscription;
  variant?: "desktop" | "mobile";
}>;

export function HeaderContent({
  isAdmin = false,
  onLinkClick,
  user,
  variant = "desktop",
}: HeaderContentProps) {
  const isMobile = variant === "mobile";
  const containerClassName = isMobile
    ? "flex flex-col justify-between h-full gap-6 mt-20 px-4 mb-5"
    : "flex items-center gap-4";
  const linkClassName = isMobile
    ? "rounded-md p-0 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted/50 w-fit"
    : "rounded-md p-1 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted/50";

  return (
    <div className={containerClassName}>
      <div className="flex h-full flex-col justify-between md:contents">
        {/* Rooms Link */}
        <Link className={linkClassName} href="/rooms" onClick={onLinkClick}>
          {messages.header.ui.rooms}
        </Link>

        {/* Search Bar */}
        {isMobile ? (
          <div className="space-y-2">
            <h3 className="font-medium text-sm">
              {messages.header.ui.search.label}
            </h3>
            <HeaderSearchBar onSearch={onLinkClick} />
          </div>
        ) : (
          <HeaderSearchBar />
        )}
      </div>
      {/* User Menu */}
      <HeaderMenu isAdmin={isAdmin} user={user} />
    </div>
  );
}
