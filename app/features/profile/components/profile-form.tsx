"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserWithSubscription } from "@/app/features/users/actions/get-user";
import { updateUserEmail } from "@/app/features/users/actions/update-user-email";
import { updateUserPassword } from "@/app/features/users/actions/update-user-password";
import { updateUserProfile } from "@/app/features/users/actions/update-user-profile";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { type FormState, formatErrorForToast } from "@/lib/form-errors";
import messages from "@/lib/messages.json";
import { hasError } from "@/lib/supabase-response";

type FieldErrors = {
  user_company_name?: boolean;
  email?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
};

type ProfileFormState = FormState<FieldErrors>;

type ProfileFormProps = {
  user: UserWithSubscription;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  async function handleCompanyNameUpdate(
    companyName: string,
    errors: string[],
    fieldErrors: FieldErrors
  ): Promise<boolean> {
    if (!companyName || companyName.trim() === user.user_company_name) {
      return false;
    }

    const result = await updateUserProfile({ user_company_name: companyName });
    if (hasError(result)) {
      errors.push(result.error.message);
      fieldErrors.user_company_name = true;
    }
    return true;
  }

  async function handleEmailUpdate(
    email: string,
    errors: string[],
    fieldErrors: FieldErrors
  ): Promise<boolean> {
    const trimmedEmail = email.trim();
    if (!email || trimmedEmail === user.user_email) {
      return false;
    }

    const result = await updateUserEmail({ email: trimmedEmail });
    if (hasError(result)) {
      errors.push(result.error.message);
      fieldErrors.email = true;
    }
    return true;
  }

  async function handlePasswordUpdate(
    password: string,
    confirmPassword: string,
    errors: string[],
    fieldErrors: FieldErrors
  ): Promise<boolean> {
    if (!password) {
      return false;
    }

    if (password !== confirmPassword) {
      errors.push(messages.users.validation.password.mismatch);
      fieldErrors.password = true;
      fieldErrors.confirmPassword = true;
      return true;
    }

    const result = await updateUserPassword({ password });
    if (!result.success) {
      const errorMessage =
        result.error?.message || messages.profile.messages.error.update.unknown;
      errors.push(errorMessage);
      fieldErrors.password = true;
    }
    return true;
  }

  async function formAction(
    _previousState: ProfileFormState | null,
    formData: FormData
  ): Promise<ProfileFormState> {
    const errors: string[] = [];
    const fieldErrors: FieldErrors = {};

    const companyName = formData.get("companyName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const companyNameUpdated = await handleCompanyNameUpdate(
      companyName,
      errors,
      fieldErrors
    );
    const emailUpdated = await handleEmailUpdate(email, errors, fieldErrors);
    const passwordUpdated = await handlePasswordUpdate(
      password,
      confirmPassword,
      errors,
      fieldErrors
    );

    const hasUpdates = companyNameUpdated || emailUpdated || passwordUpdated;

    if (!hasUpdates) {
      return {
        error: messages.profile.messages.error.update.noChanges,
        success: false,
      };
    }

    if (errors.length > 0) {
      toast.error(formatErrorForToast({ message: errors.join(". ") }));
      return {
        error: errors.join(". "),
        fieldErrors,
        success: false,
      };
    }

    toast.success(messages.profile.messages.success.update);
    router.refresh();
    formRef.current?.reset();
    setShowPasswordFields(false);
    return {
      error: null,
      success: true,
    };
  }

  const [state, formActionHandler, isPending] = useActionState(
    formAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setShowPasswordFields(false);
    }
  }, [state?.success]);

  return (
    <div className="space-y-6">
      <Heading as="h2" size="h2">
        {messages.profile.ui.update.title}
      </Heading>
      <form action={formActionHandler} className="space-y-4" ref={formRef}>
        <Field>
          <FieldLabel htmlFor="profile-company-name">
            {messages.profile.ui.update.companyNameLabel}
          </FieldLabel>
          <Input
            defaultValue={user.user_company_name}
            disabled={isPending}
            error={state?.fieldErrors?.user_company_name}
            id="profile-company-name"
            name="companyName"
            placeholder={messages.profile.ui.update.companyNamePlaceholder}
            type="text"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-email">
            {messages.profile.ui.update.emailLabel}
          </FieldLabel>
          <Input
            defaultValue={user.user_email}
            disabled={isPending}
            error={state?.fieldErrors?.email}
            id="profile-email"
            name="email"
            placeholder={messages.profile.ui.update.emailPlaceholder}
            type="email"
          />
          <FieldDescription>
            {messages.profile.ui.update.emailHelper}
          </FieldDescription>
        </Field>

        {!showPasswordFields && (
          <Field>
            <FieldLabel htmlFor="profile-password-toggle">
              {messages.profile.ui.update.passwordLabel}
            </FieldLabel>
            <Button
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                setShowPasswordFields(true);
              }}
              type="button"
              variant="outline"
            >
              {messages.profile.ui.update.changePasswordButton}
            </Button>
            <FieldDescription>
              {messages.profile.ui.update.passwordHelper}
            </FieldDescription>
          </Field>
        )}

        {showPasswordFields ? (
          <>
            <Field>
              <FieldLabel htmlFor="profile-password">
                {messages.profile.ui.update.newPasswordLabel}
              </FieldLabel>
              <Input
                disabled={isPending}
                error={state?.fieldErrors?.password}
                id="profile-password"
                name="password"
                placeholder={messages.profile.ui.update.newPasswordPlaceholder}
                type="password"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-confirm-password">
                {messages.profile.ui.update.confirmPasswordLabel}
              </FieldLabel>
              <Input
                disabled={isPending}
                error={state?.fieldErrors?.confirmPassword}
                id="profile-confirm-password"
                name="confirmPassword"
                placeholder={
                  messages.profile.ui.update.confirmPasswordPlaceholder
                }
                type="password"
              />
            </Field>
          </>
        ) : null}

        <Button
          className="w-full"
          disabled={isPending}
          loading={isPending}
          loadingText={messages.profile.ui.update.submitButtonLoading}
          type="submit"
        >
          {messages.profile.ui.update.submitButton}
        </Button>
      </form>
    </div>
  );
}
