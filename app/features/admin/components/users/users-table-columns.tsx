"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Calendar, CreditCard, Mail, Shield } from "lucide-react";
import type { AdminUser } from "@/app/features/admin/actions/get-all-users-admin";
import { TableHeaderCell } from "@/app/features/admin/components/meeting-rooms/table-header-cell";
import { UserActions } from "@/app/features/admin/components/users/user-actions";
import type { Subscription } from "@/app/features/admin/lib/subscription.schema";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date-time";
import { formatPrice } from "@/lib/format-price";
import messages from "@/lib/messages.json";

// Type guards and helpers
function isUserSubscription(
  subscription: unknown
): subscription is Subscription {
  return (
    typeof subscription === "object" &&
    subscription !== null &&
    "subscription_name" in subscription
  );
}

export const usersColumns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "user_company_name",
    header: () => (
      <TableHeaderCell icon={Building2}>
        {messages.admin.ui.tabs.users.table.company}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const companyName = row.getValue("user_company_name");
      if (typeof companyName !== "string") {
        return "-";
      }
      return companyName;
    },
  },
  {
    accessorKey: "user_email",
    header: () => (
      <TableHeaderCell icon={Mail}>
        {messages.admin.ui.tabs.users.table.email}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const email = row.getValue("user_email");
      if (typeof email !== "string") {
        return "-";
      }
      return email;
    },
  },
  {
    id: "subscription",
    header: () => (
      <TableHeaderCell icon={CreditCard}>
        {messages.admin.ui.tabs.users.table.subscription}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const subscription = row.original.subscriptions;
      if (!isUserSubscription(subscription)) {
        return "-";
      }
      return (
        <div className="grid">
          <span>{subscription.subscription_name}</span>
          <span className="text-muted-foreground text-xs">
            {formatPrice(subscription.subscription_monthly_price)}{" "}
            {messages.common.units.currency}/mo
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "user_current_monthly_bookings",
    header: () => (
      <TableHeaderCell icon={Calendar}>
        {messages.admin.ui.tabs.users.table.monthlyBookings}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const bookings = row.getValue("user_current_monthly_bookings");
      const subscription = row.original.subscriptions;
      if (typeof bookings !== "number") {
        return "-";
      }
      const maxBookings = isUserSubscription(subscription)
        ? subscription.subscription_max_monthly_bookings
        : null;
      const maxText = maxBookings ? ` / ${maxBookings}` : "";
      return `${bookings}${maxText}`;
    },
  },
  {
    accessorKey: "user_created_at",
    header: () => (
      <TableHeaderCell icon={Calendar}>
        {messages.admin.ui.tabs.users.table.createdAt}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("user_created_at");
      if (typeof createdAt !== "string") {
        return "-";
      }
      return formatDate(new Date(createdAt));
    },
  },
  {
    id: "status",
    header: () => (
      <TableHeaderCell icon={Shield}>
        {messages.admin.ui.tabs.users.table.status}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const isBanned = row.original.user_is_banned ?? false;
      return (
        <Badge pill variant={isBanned ? "cancelled" : "paid"}>
          {isBanned
            ? messages.admin.ui.tabs.users.table.banned
            : messages.admin.ui.tabs.users.table.active}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return <UserActions user={user} />;
    },
  },
];
