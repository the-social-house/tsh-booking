import { Suspense } from "react";
import type { AdminBooking } from "@/app/features/admin/actions/get-all-bookings-admin";
import { AdminDataTableSkeleton } from "@/app/features/admin/components/admin-data-table";
import { bookingsColumns } from "@/app/features/admin/components/bookings/bookings-table-columns";
import { BookingsTableContent } from "@/app/features/admin/components/bookings/bookings-table-content";
import TableActionHeader from "@/app/features/admin/components/table-action-header";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";

type BookingsTableProps = Readonly<{
  bookingsPromise: Promise<SupabaseResponse<AdminBooking[]>>;
}>;

export function BookingsTable({ bookingsPromise }: BookingsTableProps) {
  return (
    <section>
      <TableActionHeader title={messages.admin.ui.tabs.bookings.title} />
      <Suspense
        fallback={
          <AdminDataTableSkeleton columnCount={bookingsColumns.length} />
        }
      >
        <BookingsTableContent promise={bookingsPromise} />
      </Suspense>
    </section>
  );
}
