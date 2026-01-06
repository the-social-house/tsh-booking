import type { Metadata } from "next";
import { Suspense } from "react";
import ProfileContent from "@/app/features/profile/components/profile-content";
import { getCurrentUserData } from "@/app/features/users/actions/get-current-user-data";
import { TwoColumnSkeleton } from "@/components/ui/two-column-skeleton";
import messages from "@/lib/messages.json";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata(
  messages.metadata.profile.title,
  messages.metadata.profile.description
);

export default async function ProfilePage() {
  const userPromise = getCurrentUserData();

  return (
    <Suspense fallback={<TwoColumnSkeleton />}>
      <ProfileContent userPromise={userPromise} />
    </Suspense>
  );
}
