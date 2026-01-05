"use client";

import { use } from "react";
import { ProfileForm } from "@/app/features/profile/components/profile-form";
import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import EmptyFallback from "@/components/ui/empty-fallback";
import ErrorFallback from "@/components/ui/error-fallback";
import Heading from "@/components/ui/heading";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";
import { hasData, hasError } from "@/lib/supabase-response";

type ProfileContentProps = {
  userPromise: Promise<SupabaseResponse<UserWithSubscription>>;
};

export default function ProfileContent({ userPromise }: ProfileContentProps) {
  const user = use(userPromise);

  // 1. Check for errors FIRST
  if (hasError(user)) {
    return (
      <ErrorFallback
        description={user.error.message}
        title={messages.common.messages.error}
      />
    );
  }

  // 2. Check for empty data SECOND
  if (!hasData(user)) {
    return (
      <EmptyFallback
        description={messages.profile.ui.empty}
        title={messages.profile.ui.emptyTitle}
      />
    );
  }

  // 3. Render content when data exists
  return (
    <TwoColumnLayout
      className="container mx-auto"
      left={
        <Heading as="h1" eyebrow={messages.profile.ui.eyebrow} size="h1">
          {messages.profile.ui.title}
        </Heading>
      }
      right={<ProfileForm user={user.data} />}
      variant="left-narrow"
    />
  );
}
