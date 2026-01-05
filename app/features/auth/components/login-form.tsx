"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { signIn } from "@/app/features/auth/actions/sign-in";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  type FormState,
  formatErrorForToast,
  parseFieldErrors,
} from "@/lib/form-errors";
import messages from "@/lib/messages.json";

type FieldErrors = {
  email?: boolean;
  password?: boolean;
};

type LoginFormState = FormState<FieldErrors>;

export function LoginForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  async function formAction(
    _previousState: LoginFormState | null,
    formData: FormData
  ): Promise<LoginFormState> {
    // 1. Extract and type form data
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 2. Call server action
    const result = await signIn({ email, password });

    // 3. Handle errors
    if (result.error) {
      toast.error(formatErrorForToast(result.error));
      return {
        error: result.error.message,
        fieldErrors: parseFieldErrors<FieldErrors>(result.error.details),
        success: false,
      };
    }

    // 4. Handle success - redirect happens in signIn action
    toast.success(messages.auth.messages.success.signIn);
    router.refresh();
    return {
      error: null,
      success: true,
    };
  }

  const [state, formActionHandler, isPending] = useActionState(
    formAction,
    null
  );

  // Reset form on success
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <section className="-my-10 grid h-svh grid-cols-1 items-center overflow-hidden md:grid-cols-2">
      <div className="px-6">
        <div className="grid h-fit w-full grid-cols-1 grid-rows-[auto_auto] items-center gap-6 px-6 md:grid-cols-[max-content_auto_1fr]">
          <div className="space-y-4">
            <Image
              alt="The Social House Logo"
              height={200}
              src="/tsh-logo.svg"
              width={250}
            />
            <Heading as="h1" size="h1">
              {messages.auth.ui.login.title}
            </Heading>
          </div>
          <Separator className="hidden md:block" orientation="vertical" />
          <form
            action={formActionHandler}
            className="w-full space-y-4"
            ref={formRef}
          >
            <Field>
              <FieldLabel htmlFor="email">
                {messages.auth.ui.login.emailLabel}
              </FieldLabel>
              <Input
                disabled={isPending}
                error={state?.fieldErrors?.email}
                id="email"
                name="email"
                placeholder={messages.auth.ui.login.emailPlaceholder}
                required
                type="email"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">
                {messages.auth.ui.login.passwordLabel}
              </FieldLabel>
              <Input
                disabled={isPending}
                error={state?.fieldErrors?.password}
                id="password"
                name="password"
                required
                type="password"
              />
            </Field>
            <Button
              className="w-full"
              disabled={isPending}
              loading={isPending}
              loadingText={messages.auth.ui.login.submitButtonLoading}
              type="submit"
            >
              {messages.auth.ui.login.submitButton}
            </Button>
          </form>
        </div>
      </div>
      <div className="relative hidden aspect-3/4 size-full md:block">
        <Image alt="The Social House" fill src="/login-hero.webp" />
      </div>
    </section>
  );
}
