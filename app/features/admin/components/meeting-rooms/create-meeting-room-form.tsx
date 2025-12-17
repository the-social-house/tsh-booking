"use client";

import { XIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { createMeetingRoom } from "@/app/features/admin/actions/create-meeting-room";
import { uploadMeetingRoomImages } from "@/app/features/admin/actions/upload-meeting-room-images";
import {
  createMeetingRoomSchema,
  meetingRoomImagesSchema,
} from "@/app/features/admin/lib/meeting-room.schema";

function generateFolderId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/dropzone";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type FormState,
  formatErrorForToast,
  parseFieldErrors,
} from "@/lib/form-errors";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";
import type { TablesInsert } from "@/supabase/types/database";

type FieldErrors = {
  meeting_room_name?: boolean;
  meeting_room_capacity?: boolean;
  meeting_room_price_per_hour?: boolean;
  meeting_room_size?: boolean;
  images?: boolean;
};

type FormValues = {
  meeting_room_name: string;
  meeting_room_capacity: string;
  meeting_room_price_per_hour: string;
  meeting_room_size: string;
};

type CreateMeetingRoomFormState = FormState<FieldErrors> & {
  values?: FormValues;
};

type CreateMeetingRoomFormProps = {
  onSuccess?: () => void;
};

type ImagePreview = {
  file: File;
  preview: string;
};

function parseFormData(formData: FormData): TablesInsert<"meeting_rooms"> {
  return {
    meeting_room_name: formData.get("meeting_room_name") as string,
    meeting_room_capacity: formData.get("meeting_room_capacity")
      ? Number(formData.get("meeting_room_capacity"))
      : 0,
    meeting_room_price_per_hour: formData.get("meeting_room_price_per_hour")
      ? Number(formData.get("meeting_room_price_per_hour"))
      : 0,
    meeting_room_size: formData.get("meeting_room_size")
      ? Number(formData.get("meeting_room_size"))
      : 0,
  };
}

function extractFormValues(formData: FormData): FormValues {
  return {
    meeting_room_name: (formData.get("meeting_room_name") as string) ?? "",
    meeting_room_capacity:
      (formData.get("meeting_room_capacity") as string) ?? "",
    meeting_room_price_per_hour:
      (formData.get("meeting_room_price_per_hour") as string) ?? "",
    meeting_room_size: (formData.get("meeting_room_size") as string) ?? "",
  };
}

async function handleImageUpload(
  folderId: string,
  images: ImagePreview[],
  setIsUploading: (value: boolean) => void
): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  if (images.length === 0) {
    return { success: true, urls: [] };
  }

  setIsUploading(true);
  const imageFormData = new FormData();
  for (const image of images) {
    imageFormData.append("images", image.file);
  }

  const uploadResult = await uploadMeetingRoomImages(folderId, imageFormData);
  setIsUploading(false);

  return uploadResult;
}

type ValidationResult = {
  isValid: boolean;
  fieldErrors: FieldErrors;
  errorMessages: string[];
};

function validateForm(
  data: ReturnType<typeof parseFormData>,
  imageFiles: File[]
): ValidationResult {
  const fieldErrors: FieldErrors = {};
  const errorMessages: string[] = [];

  // Validate form fields
  const formValidation = createMeetingRoomSchema.safeParse(data);
  if (!formValidation.success) {
    for (const issue of formValidation.error.issues) {
      const fieldName = issue.path[0] as keyof FieldErrors;
      fieldErrors[fieldName] = true;
      errorMessages.push(issue.message);
    }
  }

  // Validate images
  const imagesValidation = meetingRoomImagesSchema.safeParse(imageFiles);
  if (!imagesValidation.success) {
    fieldErrors.images = true;
    const imageErrorMessage =
      imagesValidation.error.issues[0]?.message ?? "Invalid images";
    errorMessages.push(imageErrorMessage);
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    errorMessages,
  };
}

export default function CreateMeetingRoomForm({
  onSuccess,
}: CreateMeetingRoomFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Cleanup preview URLs on unmount
  useEffect(
    () => () => {
      for (const image of images) {
        URL.revokeObjectURL(image.preview);
      }
    },
    [images]
  );

  const handleImageDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleImageError = useCallback((error: Error) => {
    toast.error(error.message, {
      duration: 10_000,
    });
  }, []);

  async function formAction(
    _previousState: CreateMeetingRoomFormState | null,
    formData: FormData
  ): Promise<CreateMeetingRoomFormState> {
    const values = extractFormValues(formData);
    const data = parseFormData(formData);
    const imageFiles = images.map((img) => img.file);

    // Validate form fields and images client-side
    const validation = validateForm(data, imageFiles);

    if (!validation.isValid) {
      toast.error(
        formatErrorForToast({ message: validation.errorMessages.join(". ") }),
        {
          duration: 10_000,
        }
      );
      return {
        error: validation.errorMessages.join(". "),
        fieldErrors: validation.fieldErrors,
        success: false,
        values,
      };
    }

    // Upload images first (before creating room)
    const folderId = generateFolderId();
    const uploadResult = await handleImageUpload(
      folderId,
      images,
      setIsUploading
    );

    if (!uploadResult.success) {
      toast.error(uploadResult.error ?? "Failed to upload images");
      return {
        error: uploadResult.error ?? "Failed to upload images",
        fieldErrors: { images: true },
        success: false,
        values,
      };
    }

    // Create room with image URLs
    const result = await createMeetingRoom({
      ...data,
      meeting_room_images: uploadResult.urls ?? [],
    });

    if (hasError(result)) {
      const serverFieldErrors = parseFieldErrors<FieldErrors>(
        result.error.details
      );
      toast.error(formatErrorForToast({ message: result.error.message }));
      return {
        error: result.error.message,
        fieldErrors: serverFieldErrors,
        success: false,
        values,
      };
    }

    if (!hasData(result)) {
      return {
        error: messages.admin.meetingRooms.messages.error.create.unknown,
        success: false,
        values,
      };
    }

    toast.success(messages.admin.meetingRooms.messages.success.create);
    setImages([]);
    router.refresh();
    onSuccess?.();

    return { error: null, success: true };
  }

  const [state, formActionHandler, isPending] = useActionState(
    formAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  const isLoading = isPending || isUploading;

  return (
    <form action={formActionHandler} className="space-y-6" ref={formRef}>
      <Field>
        <FieldLabel htmlFor="create-meeting-room-name">
          {messages.admin.meetingRooms.ui.create.nameLabel}
        </FieldLabel>
        <Input
          defaultValue={state?.values?.meeting_room_name}
          disabled={isLoading}
          error={state?.fieldErrors?.meeting_room_name}
          id="create-meeting-room-name"
          key={state?.values?.meeting_room_name}
          name="meeting_room_name"
          placeholder={messages.admin.meetingRooms.ui.create.namePlaceholder}
          type="text"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="create-meeting-room-capacity">
          {messages.admin.meetingRooms.ui.create.capacityLabel}
        </FieldLabel>
        <Input
          defaultValue={state?.values?.meeting_room_capacity}
          disabled={isLoading}
          error={state?.fieldErrors?.meeting_room_capacity}
          id="create-meeting-room-capacity"
          key={state?.values?.meeting_room_capacity}
          name="meeting_room_capacity"
          placeholder={
            messages.admin.meetingRooms.ui.create.capacityPlaceholder
          }
          type="number"
        />
        <FieldDescription>
          {messages.admin.meetingRooms.ui.create.capacityHelper}
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="create-meeting-room-price">
          {messages.admin.meetingRooms.ui.create.pricePerHourLabel}
        </FieldLabel>
        <Input
          defaultValue={state?.values?.meeting_room_price_per_hour}
          disabled={isLoading}
          error={state?.fieldErrors?.meeting_room_price_per_hour}
          id="create-meeting-room-price"
          key={state?.values?.meeting_room_price_per_hour}
          name="meeting_room_price_per_hour"
          placeholder={
            messages.admin.meetingRooms.ui.create.pricePerHourPlaceholder
          }
          type="number"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="create-meeting-room-size">
          {messages.admin.meetingRooms.ui.create.sizeLabel}
        </FieldLabel>
        <Input
          defaultValue={state?.values?.meeting_room_size}
          disabled={isLoading}
          error={state?.fieldErrors?.meeting_room_size}
          id="create-meeting-room-size"
          key={state?.values?.meeting_room_size}
          name="meeting_room_size"
          placeholder={messages.admin.meetingRooms.ui.create.sizePlaceholder}
          type="number"
        />
      </Field>

      <Field>
        <FieldLabel>
          {messages.admin.meetingRooms.ui.create.imagesLabel}
        </FieldLabel>
        <Dropzone
          accept={{
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
          }}
          disabled={isLoading}
          error={state?.fieldErrors?.images}
          maxFiles={10}
          maxSize={5 * 1024 * 1024}
          onDrop={handleImageDrop}
          onError={handleImageError}
          src={images.map((img) => img.file)}
        >
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
        <FieldDescription>
          {messages.admin.meetingRooms.ui.create.imagesHelper}
        </FieldDescription>
      </Field>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div
              className="group relative aspect-video overflow-hidden rounded-md border bg-muted"
              key={image.preview}
            >
              <Image
                alt={`Preview ${index + 1}`}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 33vw, 100px"
                src={image.preview}
              />
              <button
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleRemoveImage(index)}
                type="button"
              >
                <XIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        className="w-full"
        disabled={isLoading}
        loading={isLoading}
        loadingText={
          isUploading
            ? "Uploading images..."
            : messages.admin.meetingRooms.ui.create.submitButtonLoading
        }
        type="submit"
      >
        {messages.admin.meetingRooms.ui.create.submitButton}
      </Button>
    </form>
  );
}
