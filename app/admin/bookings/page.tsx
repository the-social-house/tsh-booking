import { redirect } from "next/navigation";
import { getAllBookings } from "@/app/features/admin/actions/get-all-bookings-admin";
import { AdminNav } from "@/app/features/admin/components/admin-nav";
import { BookingsTable } from "@/app/features/admin/components/bookings/bookings-table";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";

async function AdminBookingsPage() {
  // Verify admin access
  const adminResult = await requireAdmin();
  if (adminResult.error || !adminResult.user) {
    redirect("/");
  }

  const bookingsPromise = getAllBookings();

  return (
    <TwoColumnLayout
      left={
        <>
          <AdminNav />
          <BookingsTable bookingsPromise={bookingsPromise} />
        </>
      }
      variant="full"
    />
  );
}

export default AdminBookingsPage;
