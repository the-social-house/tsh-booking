"use client";

import { use } from "react";
import type { AdminBooking } from "@/app/features/admin/actions/get-all-bookings-admin";
import { AdminDataTable } from "@/app/features/admin/components/admin-data-table";
import { bookingsColumns } from "@/app/features/admin/components/bookings/bookings-table-columns";
import EmptyFallback from "@/components/ui/empty-fallback";
import ErrorFallback from "@/components/ui/error-fallback";
import messages from "@/lib/messages.json";
import {
  hasData,
  hasError,
  type SupabaseResponse,
} from "@/lib/supabase-response";

type BookingsTableContentProps = Readonly<{
  promise: Promise<SupabaseResponse<AdminBooking[]>>;
}>;

export function BookingsTableContent({ promise }: BookingsTableContentProps) {
  const result = use(promise);

  if (hasError(result)) {
    return (
      <ErrorFallback
        description={messages.admin.ui.tabs.bookings.error}
        title={messages.admin.ui.tabs.bookings.errorTitle}
      />
    );
  }

  if (!hasData(result)) {
    return (
      <EmptyFallback
        description={messages.admin.ui.tabs.bookings.empty}
        title={messages.admin.ui.tabs.bookings.emptyTitle}
      />
    );
  }

  if (result.data.length === 0) {
    return (
      <EmptyFallback
        description={messages.admin.ui.tabs.bookings.empty}
        title={messages.admin.ui.tabs.bookings.emptyTitle}
      />
    );
  }

  return <AdminDataTable columns={bookingsColumns} data={result.data} />;
}
