import { redirect } from "next/navigation";
import { getAllSubscriptions } from "@/app/features/admin/actions/get-all-subscriptions";
import { AdminNav } from "@/app/features/admin/components/admin-nav";
import { SubscriptionsTable } from "@/app/features/admin/components/subscriptions/subscriptions-table";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";

async function AdminSubscriptionsPage() {
  // Verify admin access
  const adminResult = await requireAdmin();
  if (adminResult.error || !adminResult.user) {
    redirect("/");
  }

  const subscriptionsPromise = getAllSubscriptions();

  return (
    <TwoColumnLayout
      left={
        <>
          <AdminNav />
          <SubscriptionsTable subscriptionsPromise={subscriptionsPromise} />
        </>
      }
      variant="full"
    />
  );
}

export default AdminSubscriptionsPage;
