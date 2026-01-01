"use client";

import { use } from "react";
import { AdminDataTable } from "@/app/features/admin/components/admin-data-table";
import { subscriptionsColumns } from "@/app/features/admin/components/subscriptions/subscriptions-table-columns";
import type { Subscription } from "@/app/features/admin/lib/subscription.schema";
import EmptyFallback from "@/components/ui/empty-fallback";
import ErrorFallback from "@/components/ui/error-fallback";
import messages from "@/lib/messages.json";
import {
  hasData,
  hasError,
  type SupabaseResponse,
} from "@/lib/supabase-response";

type SubscriptionsTableContentProps = Readonly<{
  promise: Promise<SupabaseResponse<Subscription[]>>;
}>;

export function SubscriptionsTableContent({
  promise,
}: SubscriptionsTableContentProps) {
  const result = use(promise);

  if (hasError(result)) {
    return (
      <ErrorFallback
        description={messages.admin.ui.tabs.subscriptions.error}
        title={messages.admin.ui.tabs.subscriptions.errorTitle}
      />
    );
  }

  if (!hasData(result) || result.data.length === 0) {
    return (
      <EmptyFallback
        description={messages.admin.ui.tabs.subscriptions.empty}
        title={messages.admin.ui.tabs.subscriptions.emptyTitle}
      />
    );
  }

  return <AdminDataTable columns={subscriptionsColumns} data={result.data} />;
}
