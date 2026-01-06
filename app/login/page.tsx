import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/features/auth/actions/get-current-user";
import { LoginForm } from "@/app/features/auth/components/login-form";
import messages from "@/lib/messages.json";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata(
  messages.metadata.auth.login.title,
  messages.metadata.auth.login.description
);

export default async function LoginPage() {
  // Redirect to home if already logged in
  const { user } = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return <LoginForm />;
}
