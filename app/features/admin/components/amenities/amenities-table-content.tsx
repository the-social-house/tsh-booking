"use client";

import { use } from "react";
import { AdminDataTable } from "@/app/features/admin/components/admin-data-table";
import { amenitiesColumns } from "@/app/features/admin/components/amenities/amenities-table-columns";
import type { AdminAmenity } from "@/app/features/amenities/actions/get-amenities";
import EmptyFallback from "@/components/ui/empty-fallback";
import ErrorFallback from "@/components/ui/error-fallback";
import messages from "@/lib/messages.json";
import {
  hasData,
  hasError,
  type SupabaseResponse,
} from "@/lib/supabase-response";

type AmenitiesTableContentProps = Readonly<{
  promise: Promise<SupabaseResponse<AdminAmenity[]>>;
}>;

export function AmenitiesTableContent({ promise }: AmenitiesTableContentProps) {
  const result = use(promise);

  if (hasError(result)) {
    return (
      <ErrorFallback
        description={messages.admin.ui.tabs.amenities.error}
        title={messages.admin.ui.tabs.amenities.errorTitle}
      />
    );
  }

  if (!hasData(result) || result.data.length === 0) {
    return (
      <EmptyFallback
        description={messages.admin.ui.tabs.amenities.empty}
        title={messages.admin.ui.tabs.amenities.emptyTitle}
      />
    );
  }

  return <AdminDataTable columns={amenitiesColumns} data={result.data} />;
}
