"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateAmenity } from "@/app/features/admin/actions/update-amenity";
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
  amenity_name?: boolean;
  amenity_price?: boolean;
};

type EditAmenityFormState = FormState<FieldErrors>;

type EditAmenityFormProps = {
  amenity_id: string;
  amenity_name?: string;
  amenity_price?: number | null;
  onSuccess?: () => void;
};

export default function EditAmenityForm({
  amenity_id,
  amenity_name,
  amenity_price,
  onSuccess,
}: EditAmenityFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  async function formActionHandler(
    _previousState: EditAmenityFormState | null,
    formData: FormData
  ): Promise<EditAmenityFormState> {
    const priceValue = formData.get("amenity_price") as string;
    const data: TablesUpdate<"amenities"> = {
      amenity_name: formData.get("amenity_name") as string,
      amenity_price:
        priceValue && priceValue.trim() !== "" ? Number(priceValue) : null,
    };

    const result = await updateAmenity(amenity_id, data);

    if (hasError(result)) {
      toast.error(formatErrorForToast(result.error));

      return {
        error: result.error.message,
        fieldErrors: parseFieldErrors<FieldErrors>(result.error.details),
        success: false,
      };
    }

    if (!hasData(result)) {
      toast.error(messages.amenities.messages.error.update.notFound);

      return {
        error: messages.amenities.messages.error.update.notFound,
        success: false,
      };
    }

    toast.success(messages.amenities.messages.success.update);
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
          <FieldLabel htmlFor="update-amenity-name">
            {messages.amenities.ui.update.nameLabel}
          </FieldLabel>
          <Input
            defaultValue={amenity_name}
            disabled={isPending}
            error={state?.fieldErrors?.amenity_name}
            id="update-amenity-name"
            name="amenity_name"
            placeholder={messages.amenities.ui.update.namePlaceholder}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="update-amenity-price">
            {messages.amenities.ui.update.priceLabel}
          </FieldLabel>
          <Input
            defaultValue={amenity_price ?? ""}
            disabled={isPending}
            error={state?.fieldErrors?.amenity_price}
            id="update-amenity-price"
            min="0"
            name="amenity_price"
            placeholder={messages.amenities.ui.update.pricePlaceholder}
            step="0.01"
            type="number"
          />
          <FieldDescription>
            {messages.amenities.ui.update.priceHelper}
          </FieldDescription>
        </Field>
        <div className="flex gap-3">
          <Button
            className="flex-1"
            disabled={isPending}
            loading={isPending}
            loadingText={messages.amenities.ui.update.submitButtonLoading}
            type="submit"
          >
            {messages.amenities.ui.update.submitButton}
          </Button>
        </div>
      </form>
    </div>
  );
}
