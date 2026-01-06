"use client";

import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import { HeaderContent } from "@/components/layout/header-content";

type DesktopHeaderProps = Readonly<{
  isAdmin?: boolean;
  user: UserWithSubscription | null;
}>;

export function DesktopHeader({ isAdmin = false, user }: DesktopHeaderProps) {
  if (!user) {
    return null;
  }

  return (
    <div className="max-lg:hidden">
      <HeaderContent isAdmin={isAdmin} user={user} variant="desktop" />
    </div>
  );
}
