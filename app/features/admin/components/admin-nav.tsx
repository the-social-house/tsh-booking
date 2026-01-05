"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import messages from "@/lib/messages.json";

export function AdminNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Ensure consistent initial render between server and client
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      href: "/admin/rooms",
      label: messages.admin.ui.tabs.meetingRooms.title,
    },
    {
      href: "/admin/bookings",
      label: messages.admin.ui.tabs.bookings.title,
    },
    {
      href: "/admin/users",
      label: messages.admin.ui.tabs.users.title,
    },
    {
      href: "/admin/amenities",
      label: messages.admin.ui.tabs.amenities.title,
    },
    {
      href: "/admin/subscriptions",
      label: messages.admin.ui.tabs.subscriptions.title,
    },
  ];

  // Use pathname only after mount to avoid hydration mismatch
  // Default to first nav item for initial server render
  const activeValue = mounted ? pathname : navItems[0]?.href || "";

  return (
    <nav className="mb-6">
      <Tabs suppressHydrationWarning value={activeValue}>
        <TabsList suppressHydrationWarning>
          {navItems.map((item) => (
            <TabsTrigger
              asChild
              key={item.href}
              suppressHydrationWarning
              value={item.href}
            >
              <Link href={item.href}>{item.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </nav>
  );
}
