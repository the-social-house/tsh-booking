import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/features/auth/actions/get-current-user";
import { LoginForm } from "@/app/features/auth/components/login-form";

export default async function LoginPage() {
  // Redirect to home if already logged in
  const { user } = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return <LoginForm />;
}
