"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "@/app/features/auth/actions/sign-out";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const result = await signOut();

    if (result.error) {
      toast.error("Failed to sign out. Please try again.");
      setIsSigningOut(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-lg">The Social House Booking</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            disabled={isSigningOut}
            onClick={handleSignOut}
            size="sm"
            variant="outline"
          >
            <LogOut className="mr-2 size-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </div>
    </header>
  );
}
