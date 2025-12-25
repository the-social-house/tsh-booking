"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "../actions/sign-in";

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn({ email, password });

    if (result.error) {
      toast.error(result.error.message || "Failed to sign in");
      setLoading(false);
      return;
    }

    // Success - redirect happens in signIn action
    toast.success("Signed in successfully");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                disabled={loading}
                id="email"
                name="email"
                placeholder="m@example.com"
                required
                type="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  href="/"
                >
                  Forgot your password?
                </a>
              </div>
              <Input
                disabled={loading}
                id="password"
                name="password"
                required
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Signing in..." : "Login"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
