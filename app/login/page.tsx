import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/features/auth/actions/get-current-user";
import { LoginForm } from "@/app/features/auth/components/login-form";

export default async function LoginPage() {
  // Redirect to home if already logged in
  const { user } = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
