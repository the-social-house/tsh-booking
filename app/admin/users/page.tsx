import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllRoles } from "@/app/features/admin/actions/get-all-roles";
import { getAllSubscriptions } from "@/app/features/admin/actions/get-all-subscriptions";
import { getAllUsers } from "@/app/features/admin/actions/get-all-users-admin";
import { AdminNav } from "@/app/features/admin/components/admin-nav";
import { UsersTable } from "@/app/features/admin/components/users/users-table";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import messages from "@/lib/messages.json";
import { createPageMetadata } from "@/lib/metadata";
import { hasData } from "@/lib/supabase-response";

export const metadata: Metadata = createPageMetadata(
  messages.metadata.admin.users.title,
  messages.metadata.admin.users.description
);

async function AdminUsersPage() {
  // Verify admin access
  const adminResult = await requireAdmin();
  if (adminResult.error || !adminResult.user) {
    redirect("/");
  }

  const usersPromise = getAllUsers();
  const rolesResult = await getAllRoles();
  const subscriptionsResult = await getAllSubscriptions();

  const roles = hasData(rolesResult) ? rolesResult.data : [];
  const subscriptions = hasData(subscriptionsResult)
    ? subscriptionsResult.data
    : [];

  return (
    <TwoColumnLayout
      left={
        <>
          <AdminNav />
          <UsersTable
            roles={roles}
            subscriptions={subscriptions}
            usersPromise={usersPromise}
          />
        </>
      }
      variant="full"
    />
  );
}

export default AdminUsersPage;
