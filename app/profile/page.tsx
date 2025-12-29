import { Suspense } from "react";
import ProfileContent from "@/app/features/profile/components/profile-content";
import { getCurrentUserData } from "@/app/features/users/actions/get-current-user-data";

export default async function ProfilePage() {
  const userPromise = getCurrentUserData();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent userPromise={userPromise} />
    </Suspense>
  );
}
