"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createAmenity } from "@/app/features/admin/actions/create-amenity";
import type { CreateAmenityInput } from "@/app/features/admin/lib/amenity.schema";
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
  amenity_name?: boolean;
  amenity_price?: boolean;
};

type CreateAmenityFormState = FormState<FieldErrors>;

type CreateAmenityFormProps = Readonly<{
  onSuccess?: () => void;
}>;

export default function CreateAmenityForm({
  onSuccess,
}: CreateAmenityFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  async function formAction(
    _previousState: CreateAmenityFormState | null,
    formData: FormData
  ): Promise<CreateAmenityFormState> {
    // 1. Extract and type form data
    const data: CreateAmenityInput = {
      amenity_name: formData.get("amenity_name") as string,
      amenity_price: formData.get("amenity_price")
        ? Number(formData.get("amenity_price"))
        : null,
    };

    // 2. Call server action
    const result = await createAmenity(data);

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
      toast.success(messages.amenities.messages.success.create);
      router.refresh();
      onSuccess?.();
      return {
        error: null,
        success: true,
      };
    }

    // 5. Fallback error
    return {
      error: messages.amenities.messages.error.create.unknown,
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
          <FieldLabel htmlFor="create-amenity-name">
            {messages.amenities.ui.create.nameLabel}
          </FieldLabel>
          <Input
            disabled={isPending}
            error={state?.fieldErrors?.amenity_name}
            id="create-amenity-name"
            name="amenity_name"
            placeholder={messages.amenities.ui.create.namePlaceholder}
            required
            type="text"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="create-amenity-price">
            {messages.amenities.ui.create.priceLabel}
          </FieldLabel>
          <Input
            disabled={isPending}
            error={state?.fieldErrors?.amenity_price}
            id="create-amenity-price"
            min="0"
            name="amenity_price"
            placeholder={messages.amenities.ui.create.pricePlaceholder}
            step="0.01"
            type="number"
          />
          <FieldDescription>
            {messages.amenities.ui.create.priceHelper}
          </FieldDescription>
        </Field>
        <Button
          className="w-full"
          disabled={isPending}
          loading={isPending}
          loadingText={messages.amenities.ui.create.submitButtonLoading}
          type="submit"
        >
          {messages.amenities.ui.create.submitButton}
        </Button>
      </form>
    </div>
  );
}
