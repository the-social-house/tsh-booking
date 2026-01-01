"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import messages from "@/lib/messages.json";

export function AdminNav() {
  const pathname = usePathname();

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
  ];

  return (
    <nav className="mb-6">
      <Tabs value={pathname}>
        <TabsList>
          {navItems.map((item) => (
            <TabsTrigger asChild key={item.href} value={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </nav>
  );
}
