"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createSubscription } from "@/app/features/admin/actions/create-subscription";
import type { CreateSubscriptionInput } from "@/app/features/admin/lib/subscription.schema";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type FormState,
  formatErrorForToast,
  parseFieldErrors,
} from "@/lib/form-errors";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";

type FieldErrors = {
  subscription_name?: boolean;
  subscription_monthly_price?: boolean;
  subscription_max_monthly_bookings?: boolean;
  subscription_discount_rate?: boolean;
};

type CreateSubscriptionFormState = FormState<FieldErrors>;

type CreateSubscriptionFormProps = Readonly<{
  onSuccess?: () => void;
}>;

export default function CreateSubscriptionForm({
  onSuccess,
}: CreateSubscriptionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  async function formAction(
    _previousState: CreateSubscriptionFormState | null,
    formData: FormData
  ): Promise<CreateSubscriptionFormState> {
    // 1. Extract and type form data
    const maxBookingsValue = formData.get(
      "subscription_max_monthly_bookings"
    ) as string;
    const data: CreateSubscriptionInput = {
      subscription_name: formData.get("subscription_name") as string,
      subscription_monthly_price: Number(
        formData.get("subscription_monthly_price")
      ),
      subscription_max_monthly_bookings:
        maxBookingsValue && maxBookingsValue.trim() !== ""
          ? Number(maxBookingsValue)
          : null,
      subscription_discount_rate: Number(
        formData.get("subscription_discount_rate")
      ),
    };

    // 2. Call server action
    const result = await createSubscription(data);

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
      toast.success(messages.admin.subscriptions.messages.success.create);
      router.refresh();
      onSuccess?.();
      return {
        error: null,
        success: true,
      };
    }

    // 5. Fallback error
    return {
      error: messages.admin.subscriptions.messages.error.create.unknown,
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
          <FieldLabel htmlFor="create-subscription-name">
            {messages.admin.subscriptions.ui.create.nameLabel}
          </FieldLabel>
          <Input
            disabled={isPending}
            error={state?.fieldErrors?.subscription_name}
            id="create-subscription-name"
            name="subscription_name"
            placeholder={messages.admin.subscriptions.ui.create.namePlaceholder}
            required
            type="text"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="create-subscription-monthly-price">
            {messages.admin.subscriptions.ui.create.monthlyPriceLabel}
          </FieldLabel>
          <Input
            disabled={isPending}
            error={state?.fieldErrors?.subscription_monthly_price}
            id="create-subscription-monthly-price"
            min="0"
            name="subscription_monthly_price"
            placeholder={
              messages.admin.subscriptions.ui.create.monthlyPricePlaceholder
            }
            required
            step="0.01"
            type="number"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="create-subscription-max-monthly-bookings">
            {messages.admin.subscriptions.ui.create.maxMonthlyBookingsLabel}
          </FieldLabel>
          <Input
            disabled={isPending}
            error={state?.fieldErrors?.subscription_max_monthly_bookings}
            id="create-subscription-max-monthly-bookings"
            min="0"
            name="subscription_max_monthly_bookings"
            placeholder={
              messages.admin.subscriptions.ui.create
                .maxMonthlyBookingsPlaceholder
            }
            type="number"
          />
          <FieldDescription>
            {messages.admin.subscriptions.ui.create.maxMonthlyBookingsHelper}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="create-subscription-discount-rate">
            {messages.admin.subscriptions.ui.create.discountRateLabel}
          </FieldLabel>
          <Input
            disabled={isPending}
            error={state?.fieldErrors?.subscription_discount_rate}
            id="create-subscription-discount-rate"
            max="100"
            min="0"
            name="subscription_discount_rate"
            placeholder={
              messages.admin.subscriptions.ui.create.discountRatePlaceholder
            }
            required
            step="0.01"
            type="number"
          />
        </Field>
        <Button
          className="w-full"
          disabled={isPending}
          loading={isPending}
          loadingText={
            messages.admin.subscriptions.ui.create.submitButtonLoading
          }
          type="submit"
        >
          {messages.admin.subscriptions.ui.create.submitButton}
        </Button>
      </form>
    </div>
  );
}
