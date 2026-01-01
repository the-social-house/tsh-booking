import { Suspense } from "react";
import type { AdminUser } from "@/app/features/admin/actions/get-all-users-admin";
import { AdminDataTableSkeleton } from "@/app/features/admin/components/admin-data-table";
import TableActionHeader from "@/app/features/admin/components/table-action-header";
import { usersColumns } from "@/app/features/admin/components/users/users-table-columns";
import { UsersTableContent } from "@/app/features/admin/components/users/users-table-content";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";

type UsersTableProps = Readonly<{
  usersPromise: Promise<SupabaseResponse<AdminUser[]>>;
}>;

export function UsersTable({ usersPromise }: UsersTableProps) {
  return (
    <section>
      <TableActionHeader title={messages.admin.ui.tabs.users.title} />
      <Suspense
        fallback={<AdminDataTableSkeleton columnCount={usersColumns.length} />}
      >
        <UsersTableContent promise={usersPromise} />
      </Suspense>
    </section>
  );
}
