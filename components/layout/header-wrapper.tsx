import { Suspense } from "react";
import { getCurrentUserData } from "@/app/features/users/actions/get-current-user-data";
import { hasData } from "@/lib/supabase-response";
import { Header } from "./header";

async function HeaderWithUser() {
  const userResult = await getCurrentUserData();
  const user = hasData(userResult) ? userResult.data : null;
  return <Header user={user} />;
}

export function HeaderWrapper() {
  return (
    <Suspense fallback={<Header user={null} />}>
      <HeaderWithUser />
    </Suspense>
  );
}
