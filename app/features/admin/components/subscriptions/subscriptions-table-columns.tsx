"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, Coins, Package, Percent } from "lucide-react";
import { TableHeaderCell } from "@/app/features/admin/components/meeting-rooms/table-header-cell";
import { SubscriptionActions } from "@/app/features/admin/components/subscriptions/subscription-actions";
import type { Subscription } from "@/app/features/admin/lib/subscription.schema";
import messages from "@/lib/messages.json";

export const subscriptionsColumns: ColumnDef<Subscription>[] = [
  {
    accessorKey: "subscription_name",
    header: () => (
      <TableHeaderCell icon={Package}>
        {messages.admin.ui.tabs.subscriptions.table.name}
      </TableHeaderCell>
    ),
  },
  {
    accessorKey: "subscription_monthly_price",
    header: () => (
      <TableHeaderCell icon={Coins}>
        {messages.admin.ui.tabs.subscriptions.table.monthlyPrice}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const price = row.getValue("subscription_monthly_price");
      if (typeof price !== "number") {
        return "";
      }
      return `${price.toFixed(2)} ${messages.common.units.currency}`;
    },
  },
  {
    accessorKey: "subscription_max_monthly_bookings",
    header: () => (
      <TableHeaderCell icon={Calendar}>
        {messages.admin.ui.tabs.subscriptions.table.maxMonthlyBookings}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const maxBookings = row.getValue("subscription_max_monthly_bookings");
      if (maxBookings === null || maxBookings === undefined) {
        return messages.common.words.none;
      }
      if (typeof maxBookings !== "number") {
        return "";
      }
      return maxBookings.toString();
    },
  },
  {
    accessorKey: "subscription_discount_rate",
    header: () => (
      <TableHeaderCell icon={Percent}>
        {messages.admin.ui.tabs.subscriptions.table.discountRate}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const discountRate = row.getValue("subscription_discount_rate");
      if (typeof discountRate !== "number") {
        return "";
      }
      return `${discountRate.toFixed(2)}%`;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const subscription = row.original;
      return <SubscriptionActions subscription={subscription} />;
    },
  },
];
