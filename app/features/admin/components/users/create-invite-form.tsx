"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createInvite } from "@/app/features/admin/actions/create-invite";
import type { CreateInviteInput } from "@/app/features/admin/lib/invite.schema";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type FormState,
  formatErrorForToast,
  parseFieldErrors,
} from "@/lib/form-errors";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";
import type { Tables } from "@/supabase/types/database";

type FieldErrors = {
  email?: boolean;
  companyName?: boolean;
  subscriptionId?: boolean;
  roleId?: boolean;
};

type CreateInviteFormState = FormState<FieldErrors>;

type CreateInviteFormProps = Readonly<{
  roles: Tables<"roles">[];
  subscriptions: Tables<"subscriptions">[];
  onSuccess?: () => void;
}>;

/**
 * Form component for creating user invites (admin only)
 *
 * This form allows admins to:
 * - Enter user email
 * - Enter company name
 * - Select subscription (from available subscriptions with Stripe IDs)
 * - Select role (from available roles)
 *
 * On submit, creates an invite record with a JWT token that expires in 24 hours.
 * The invite will be sent via email in a later step.
 */
export default function CreateInviteForm({
  roles,
  subscriptions,
  onSuccess,
}: CreateInviteFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  async function formAction(
    _previousState: CreateInviteFormState | null,
    formData: FormData
  ): Promise<CreateInviteFormState> {
    // 1. Extract and type form data
    const data: CreateInviteInput = {
      email: formData.get("email") as string,
      companyName: formData.get("companyName") as string,
      subscriptionId: formData.get("subscriptionId") as string,
      roleId: formData.get("roleId") as string,
    };

    // 2. Call server action
    const result = await createInvite(data);

    // 3. Handle errors
    if (hasError(result)) {
      toast.error(formatErrorForToast(result.error));
      return {
        error: result.error.message,
        fieldErrors: parseFieldErrors<FieldErrors>(result.error.details),
        success: false,
      };
    }

    // 4. Handle success
    if (hasData(result)) {
      toast.success(
        messages.admin.ui.tabs.users.invite.messages.success.create
      );
      router.refresh();
      onSuccess?.();
      return {
        error: null,
        success: true,
      };
    }

    // 5. Fallback error
    return {
      error: messages.admin.ui.tabs.users.invite.messages.error.create.unknown,
      success: false,
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
    <div className="space-y-6">
      <form action={formActionHandler} className="space-y-4" ref={formRef}>
        <Field>
          <FieldLabel htmlFor="create-invite-email">
            {messages.admin.ui.tabs.users.invite.ui.create.emailLabel}
          </FieldLabel>
          <Input
            disabled={isPending}
            error={state?.fieldErrors?.email}
            id="create-invite-email"
            name="email"
            placeholder={
              messages.admin.ui.tabs.users.invite.ui.create.emailPlaceholder
            }
            required
            type="email"
          />
          <FieldDescription>
            {messages.admin.ui.tabs.users.invite.ui.create.emailHelper}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="create-invite-company-name">
            {messages.admin.ui.tabs.users.invite.ui.create.companyNameLabel}
          </FieldLabel>
          <Input
            disabled={isPending}
            error={state?.fieldErrors?.companyName}
            id="create-invite-company-name"
            name="companyName"
            placeholder={
              messages.admin.ui.tabs.users.invite.ui.create
                .companyNamePlaceholder
            }
            required
            type="text"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="create-invite-subscription">
            {messages.admin.ui.tabs.users.invite.ui.create.subscriptionLabel}
          </FieldLabel>
          <Select disabled={isPending} name="subscriptionId" required>
            <SelectTrigger
              aria-invalid={state?.fieldErrors?.subscriptionId}
              id="create-invite-subscription"
            >
              <SelectValue
                placeholder={
                  messages.admin.ui.tabs.users.invite.ui.create
                    .subscriptionPlaceholder
                }
              />
            </SelectTrigger>
            <SelectContent>
              {subscriptions.map((subscription) => (
                <SelectItem
                  key={subscription.subscription_id}
                  value={subscription.subscription_id}
                >
                  {subscription.subscription_name} (
                  {subscription.subscription_monthly_price.toFixed(2)}{" "}
                  {messages.common.units.currency}/mo)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            {messages.admin.ui.tabs.users.invite.ui.create.subscriptionHelper}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="create-invite-role">
            {messages.admin.ui.tabs.users.invite.ui.create.roleLabel}
          </FieldLabel>
          <Select disabled={isPending} name="roleId" required>
            <SelectTrigger
              aria-invalid={state?.fieldErrors?.roleId}
              id="create-invite-role"
            >
              <SelectValue
                placeholder={
                  messages.admin.ui.tabs.users.invite.ui.create.rolePlaceholder
                }
              />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            {messages.admin.ui.tabs.users.invite.ui.create.roleHelper}
          </FieldDescription>
        </Field>

        <Button
          className="w-full"
          disabled={isPending}
          loading={isPending}
          loadingText={
            messages.admin.ui.tabs.users.invite.ui.create.submitButtonLoading
          }
          type="submit"
        >
          {messages.admin.ui.tabs.users.invite.ui.create.submitButton}
        </Button>
      </form>
    </div>
  );
}
