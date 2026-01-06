import { Suspense } from "react";
import { isAdmin } from "@/app/features/auth/actions/is-admin";
import { getCurrentUserData } from "@/app/features/users/actions/get-current-user-data";
import { hasData } from "@/lib/supabase-response";
import { Header } from "./header";

async function HeaderWithUser() {
  const userResult = await getCurrentUserData();
  const user = hasData(userResult) ? userResult.data : null;
  const admin = user ? await isAdmin() : false;
  return <Header isAdmin={admin} user={user} />;
}

export function HeaderWrapper() {
  return (
    <Suspense fallback={<Header isAdmin={false} user={null} />}>
      <HeaderWithUser />
    </Suspense>
  );
}
