"use client";

import { Suspense } from "react";
import { AdminDataTableSkeleton } from "@/app/features/admin/components/admin-data-table";
import { amenitiesColumns } from "@/app/features/admin/components/amenities/amenities-table-columns";
import { AmenitiesTableContent } from "@/app/features/admin/components/amenities/amenities-table-content";
import { CreateAmenitySheet } from "@/app/features/admin/components/amenities/create-amenity-sheet";
import TableActionHeader from "@/app/features/admin/components/table-action-header";
import type { AdminAmenity } from "@/app/features/amenities/actions/get-amenities";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";

type AmenitiesTableProps = Readonly<{
  amenitiesPromise: Promise<SupabaseResponse<AdminAmenity[]>>;
}>;

export function AmenitiesTable({ amenitiesPromise }: AmenitiesTableProps) {
  return (
    <section>
      <TableActionHeader
        actionSlot={<CreateAmenitySheet />}
        title={messages.admin.ui.tabs.amenities.title}
      />
      <Suspense
        fallback={
          <AdminDataTableSkeleton columnCount={amenitiesColumns.length} />
        }
      >
        <AmenitiesTableContent promise={amenitiesPromise} />
      </Suspense>
    </section>
  );
}
