"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import { DesktopHeader } from "@/components/layout/desktop-header";
import { MobileHeader } from "@/components/layout/mobile-header";
import messages from "@/lib/messages.json";

type HeaderProps = Readonly<{
  isAdmin?: boolean;
  user: UserWithSubscription | null;
}>;

export function Header({ isAdmin = false, user }: HeaderProps) {
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 h-(--header-height) border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/">
          <Image
            alt={messages.header.ui.logoAlt}
            height={100}
            src="/tsh-logo.svg"
            width={150}
          />
        </Link>
        <DesktopHeader isAdmin={isAdmin} user={user} />
        <MobileHeader isAdmin={isAdmin} user={user} />
      </div>
    </header>
  );
}
