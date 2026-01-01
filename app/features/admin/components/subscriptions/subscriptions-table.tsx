"use client";

import { Suspense } from "react";
import { AdminDataTableSkeleton } from "@/app/features/admin/components/admin-data-table";
import { CreateSubscriptionSheet } from "@/app/features/admin/components/subscriptions/create-subscription-sheet";
import { subscriptionsColumns } from "@/app/features/admin/components/subscriptions/subscriptions-table-columns";
import { SubscriptionsTableContent } from "@/app/features/admin/components/subscriptions/subscriptions-table-content";
import TableActionHeader from "@/app/features/admin/components/table-action-header";
import type { Subscription } from "@/app/features/admin/lib/subscription.schema";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";

type SubscriptionsTableProps = Readonly<{
  subscriptionsPromise: Promise<SupabaseResponse<Subscription[]>>;
}>;

export function SubscriptionsTable({
  subscriptionsPromise,
}: SubscriptionsTableProps) {
  return (
    <section>
      <TableActionHeader
        actionSlot={<CreateSubscriptionSheet />}
        title={messages.admin.ui.tabs.subscriptions.title}
      />
      <Suspense
        fallback={
          <AdminDataTableSkeleton columnCount={subscriptionsColumns.length} />
        }
      >
        <SubscriptionsTableContent promise={subscriptionsPromise} />
      </Suspense>
    </section>
  );
}
