"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateSubscription } from "@/app/features/admin/actions/update-subscription";
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
import type { TablesUpdate } from "@/supabase/types/database";

type FieldErrors = {
  subscription_name?: boolean;
  subscription_monthly_price?: boolean;
  subscription_max_monthly_bookings?: boolean;
  subscription_discount_rate?: boolean;
};

type EditSubscriptionFormState = FormState<FieldErrors>;

type EditSubscriptionFormProps = Readonly<{
  subscription_id: string;
  subscription_name: string;
  subscription_monthly_price: number;
  subscription_max_monthly_bookings?: number | null;
  subscription_discount_rate: number;
  onSuccess?: () => void;
}>;

export default function EditSubscriptionForm({
  subscription_id,
  subscription_name,
  subscription_monthly_price,
  subscription_max_monthly_bookings,
  subscription_discount_rate,
  onSuccess,
}: EditSubscriptionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  async function formActionHandler(
    _previousState: EditSubscriptionFormState | null,
    formData: FormData
  ): Promise<EditSubscriptionFormState> {
    const monthlyPriceValue = formData.get(
      "subscription_monthly_price"
    ) as string;
    const maxBookingsValue = formData.get(
      "subscription_max_monthly_bookings"
    ) as string;
    const discountRateValue = formData.get(
      "subscription_discount_rate"
    ) as string;

    const data: TablesUpdate<"subscriptions"> = {
      subscription_name: formData.get("subscription_name") as string,
      subscription_monthly_price: monthlyPriceValue
        ? Number(monthlyPriceValue)
        : undefined,
      subscription_max_monthly_bookings:
        maxBookingsValue && maxBookingsValue.trim() !== ""
          ? Number(maxBookingsValue)
          : null,
      subscription_discount_rate: discountRateValue
        ? Number(discountRateValue)
        : undefined,
    };

    const result = await updateSubscription(subscription_id, data);

    if (hasError(result)) {
      toast.error(formatErrorForToast(result.error));

      return {
        error: result.error.message,
        fieldErrors: parseFieldErrors<FieldErrors>(result.error.details),
        success: false,
      };
    }

    if (!hasData(result)) {
      toast.error(messages.admin.subscriptions.messages.error.update.notFound);

      return {
        error: messages.admin.subscriptions.messages.error.update.notFound,
        success: false,
      };
    }

    toast.success(messages.admin.subscriptions.messages.success.update);
    router.refresh();
    onSuccess?.();
    return {
      error: null,
      success: true,
    };
  }

  const [state, formAction, isPending] = useActionState(
    formActionHandler,
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
      <form action={formAction} className="space-y-4" ref={formRef}>
        <Field>
          <FieldLabel htmlFor="update-subscription-name">
            {messages.admin.subscriptions.ui.update.nameLabel}
          </FieldLabel>
          <Input
            defaultValue={subscription_name}
            disabled={isPending}
            error={state?.fieldErrors?.subscription_name}
            id="update-subscription-name"
            name="subscription_name"
            placeholder={messages.admin.subscriptions.ui.update.namePlaceholder}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="update-subscription-monthly-price">
            {messages.admin.subscriptions.ui.update.monthlyPriceLabel}
          </FieldLabel>
          <Input
            defaultValue={subscription_monthly_price}
            disabled={isPending}
            error={state?.fieldErrors?.subscription_monthly_price}
            id="update-subscription-monthly-price"
            min="0"
            name="subscription_monthly_price"
            placeholder={
              messages.admin.subscriptions.ui.update.monthlyPricePlaceholder
            }
            type="number"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="update-subscription-max-monthly-bookings">
            {messages.admin.subscriptions.ui.update.maxMonthlyBookingsLabel}
          </FieldLabel>
          <Input
            defaultValue={subscription_max_monthly_bookings ?? ""}
            disabled={isPending}
            error={state?.fieldErrors?.subscription_max_monthly_bookings}
            id="update-subscription-max-monthly-bookings"
            min="0"
            name="subscription_max_monthly_bookings"
            placeholder={
              messages.admin.subscriptions.ui.update
                .maxMonthlyBookingsPlaceholder
            }
            type="number"
          />
          <FieldDescription>
            {messages.admin.subscriptions.ui.update.maxMonthlyBookingsHelper}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="update-subscription-discount-rate">
            {messages.admin.subscriptions.ui.update.discountRateLabel}
          </FieldLabel>
          <Input
            defaultValue={subscription_discount_rate}
            disabled={isPending}
            error={state?.fieldErrors?.subscription_discount_rate}
            id="update-subscription-discount-rate"
            max="100"
            min="0"
            name="subscription_discount_rate"
            placeholder={
              messages.admin.subscriptions.ui.update.discountRatePlaceholder
            }
            type="number"
          />
        </Field>
        <div className="flex gap-3">
          <Button
            className="flex-1"
            disabled={isPending}
            loading={isPending}
            loadingText={
              messages.admin.subscriptions.ui.update.submitButtonLoading
            }
            type="submit"
          >
            {messages.admin.subscriptions.ui.update.submitButton}
          </Button>
        </div>
      </form>
    </div>
  );
}
