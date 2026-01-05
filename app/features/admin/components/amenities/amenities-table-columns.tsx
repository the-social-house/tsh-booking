"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Coins, Package } from "lucide-react";
import { AmenityActions } from "@/app/features/admin/components/amenities/amenity-actions";
import { TableHeaderCell } from "@/app/features/admin/components/meeting-rooms/table-header-cell";
import type { AdminAmenity } from "@/app/features/amenities/actions/get-amenities";
import { formatPrice } from "@/lib/format-price";
import messages from "@/lib/messages.json";

export const amenitiesColumns: ColumnDef<AdminAmenity>[] = [
  {
    accessorKey: "amenity_name",
    header: () => (
      <TableHeaderCell icon={Package}>
        {messages.admin.ui.tabs.amenities.table.name}
      </TableHeaderCell>
    ),
  },
  {
    accessorKey: "amenity_price",
    header: () => (
      <TableHeaderCell icon={Coins}>
        {messages.admin.ui.tabs.amenities.table.price}
      </TableHeaderCell>
    ),
    cell: ({ row }) => {
      const price = row.getValue("amenity_price") as number | null;
      if (price === null) {
        return messages.common.words.free;
      }
      return `${formatPrice(price)} ${messages.common.units.currency}`;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const amenity = row.original;
      return <AmenityActions amenity={amenity} />;
    },
  },
];
