import { redirect } from "next/navigation";
import { getAllUsers } from "@/app/features/admin/actions/get-all-users-admin";
import { AdminNav } from "@/app/features/admin/components/admin-nav";
import { UsersTable } from "@/app/features/admin/components/users/users-table";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";

async function AdminUsersPage() {
  // Verify admin access
  const adminResult = await requireAdmin();
  if (adminResult.error || !adminResult.user) {
    redirect("/");
  }

  const usersPromise = getAllUsers();

  return (
    <TwoColumnLayout
      left={
        <>
          <AdminNav />
          <UsersTable usersPromise={usersPromise} />
        </>
      }
      variant="full"
    />
  );
}

export default AdminUsersPage;
