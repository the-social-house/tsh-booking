"use client";

import { use } from "react";
import type { AdminUser } from "@/app/features/admin/actions/get-all-users-admin";
import { AdminDataTable } from "@/app/features/admin/components/admin-data-table";
import { usersColumns } from "@/app/features/admin/components/users/users-table-columns";
import EmptyFallback from "@/components/ui/empty-fallback";
import ErrorFallback from "@/components/ui/error-fallback";
import messages from "@/lib/messages.json";
import {
  hasData,
  hasError,
  type SupabaseResponse,
} from "@/lib/supabase-response";

type UsersTableContentProps = Readonly<{
  promise: Promise<SupabaseResponse<AdminUser[]>>;
}>;

export function UsersTableContent({ promise }: UsersTableContentProps) {
  const result = use(promise);

  if (hasError(result)) {
    return (
      <ErrorFallback
        description={messages.admin.ui.tabs.users.error}
        title={messages.admin.ui.tabs.users.errorTitle}
      />
    );
  }

  if (!hasData(result)) {
    return (
      <EmptyFallback
        description={messages.admin.ui.tabs.users.empty}
        title={messages.admin.ui.tabs.users.emptyTitle}
      />
    );
  }

  if (result.data.length === 0) {
    return (
      <EmptyFallback
        description={messages.admin.ui.tabs.users.empty}
        title={messages.admin.ui.tabs.users.emptyTitle}
      />
    );
  }

  return <AdminDataTable columns={usersColumns} data={result.data} />;
}
