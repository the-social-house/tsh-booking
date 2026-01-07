import type { Metadata } from "next";
import messages from "@/lib/messages.json";
import { createPageMetadata } from "@/lib/metadata";
import { CompleteSignupWrapper } from "./complete-signup-wrapper";

export const metadata: Metadata = createPageMetadata(
  messages.metadata.auth.completeSignup.title,
  messages.metadata.auth.completeSignup.description
);
export default function CompleteSignupPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <CompleteSignupWrapper />
      </div>
    </div>
  );
}
