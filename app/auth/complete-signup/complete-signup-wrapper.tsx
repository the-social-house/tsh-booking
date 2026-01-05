"use client";

import { useEffect, useState } from "react";
import { handleInviteCallback } from "@/app/features/auth/actions/handle-invite-callback";
import type { InviteTokenData } from "@/app/features/auth/actions/validate-invite-token";
import { validateInviteToken } from "@/app/features/auth/actions/validate-invite-token";
import { CompleteSignupForm } from "@/app/features/auth/components/complete-signup-form";
import ErrorFallback from "@/components/ui/error-fallback";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";

/**
 * Minimal client component that only reads URL hash and calls server actions
 * All Supabase operations happen server-side to avoid exposing credentials
 */
export function CompleteSignupWrapper() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteTokenData | null>(null);

  useEffect(() => {
    async function handleAuthAndValidate() {
      try {
        // 1. Check for auth tokens in URL hash (Supabase redirects with these)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        let result:
          | Awaited<ReturnType<typeof handleInviteCallback>>
          | Awaited<ReturnType<typeof validateInviteToken>>;

        // 2. If we have tokens, call server action to establish session
        if (accessToken && refreshToken && type === "invite") {
          result = await handleInviteCallback(accessToken, refreshToken);

          // Clear the hash from URL for cleaner UX
          window.history.replaceState(null, "", window.location.pathname);
        } else {
          // 3. No tokens in hash, try to validate existing session
          result = await validateInviteToken();
        }

        if (hasError(result)) {
          setError(result.error.message);
          setLoading(false);
          return;
        }

        if (hasData(result)) {
          setInviteData(result.data);
          setLoading(false);
          return;
        }

        setError(
          "Invalid or expired invite link. Please request a new invite."
        );
        setLoading(false);
      } catch (_err) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    }

    handleAuthAndValidate();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <ErrorFallback
            description={error}
            title={messages.auth.completeSignup.error.invalidTokenTitle}
          />
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <ErrorFallback
            description="Invalid or expired invite link. Please request a new invite."
            title={messages.auth.completeSignup.error.invalidTokenTitle}
          />
        </div>
      </div>
    );
  }

  return <CompleteSignupForm inviteData={inviteData} />;
}
