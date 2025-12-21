"use client";

import { XIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { deleteMeetingRoomImages } from "@/app/features/admin/actions/delete-meeting-room-images";
import type { AdminAmenity } from "@/app/features/admin/actions/get-amenities";
import { updateMeetingRoom } from "@/app/features/admin/actions/update-meeting-room";
import { updateMeetingRoomAmenities } from "@/app/features/admin/actions/update-meeting-room-amenities";
import { uploadMeetingRoomImages } from "@/app/features/admin/actions/upload-meeting-room-images";
import { AmenitySelector } from "@/app/features/admin/components/meeting-rooms/amenity-selector";
import { updateMeetingRoomSchema } from "@/app/features/admin/lib/meeting-room.schema";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
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

type EditMeetingRoomFormState = FormState<FieldErrors> & {
  values?: FormValues;
};

type ImagePreview = {
  file: File;
  preview: string;
};

type EditMeetingRoomFormProps = {
  meetingRoom: MeetingRoom;
  allAmenities: AdminAmenity[];
  currentAmenityIds: number[];
  onSuccess?: () => void;
};

function generateFolderId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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

function parseFormData(values: FormValues) {
  return {
    meeting_room_name: values.meeting_room_name,
    meeting_room_capacity: values.meeting_room_capacity
      ? Number(values.meeting_room_capacity)
      : 0,
    meeting_room_price_per_hour: values.meeting_room_price_per_hour
      ? Number(values.meeting_room_price_per_hour)
      : 0,
    meeting_room_size: values.meeting_room_size
      ? Number(values.meeting_room_size)
      : 0,
  };
}

type ValidationResult = {
  isValid: boolean;
  fieldErrors: FieldErrors;
  errorMessages: string[];
};

function validateImageCount(
  existingCount: number,
  newCount: number
): ValidationResult | null {
  const totalImagesCount = existingCount + newCount;
  const fieldErrors: FieldErrors = {};
  const errorMessages: string[] = [];

  if (totalImagesCount < 1) {
    fieldErrors.images = true;
    errorMessages.push(messages.admin.meetingRooms.validation.images.required);
  } else if (totalImagesCount > 10) {
    fieldErrors.images = true;
    errorMessages.push(messages.admin.meetingRooms.validation.images.maxCount);
  }

  if (errorMessages.length === 0) {
    return null;
  }

  return {
    isValid: false,
    fieldErrors,
    errorMessages,
  };
}

function validateForm(
  data: ReturnType<typeof parseFormData>
): ValidationResult {
  const fieldErrors: FieldErrors = {};
  const errorMessages: string[] = [];

  const formValidation = updateMeetingRoomSchema.safeParse(data);
  if (!formValidation.success) {
    for (const issue of formValidation.error.issues) {
      const fieldName = issue.path[0] as keyof FieldErrors;
      fieldErrors[fieldName] = true;
      errorMessages.push(issue.message);
    }
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    errorMessages,
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

export default function EditMeetingRoomForm({
  meetingRoom,
  allAmenities,
  currentAmenityIds,
  onSuccess,
}: EditMeetingRoomFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Track selected amenities
  const [selectedAmenityIds, setSelectedAmenityIds] =
    useState<number[]>(currentAmenityIds);

  // Track new images to upload
  const [newImages, setNewImages] = useState<ImagePreview[]>([]);
  // Track existing images (URLs) that should be kept
  const [existingImages, setExistingImages] = useState<string[]>(
    meetingRoom.meeting_room_images ?? []
  );
  // Map URLs to paths for easy deletion lookup
  const urlToPathMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const url of meetingRoom.meeting_room_images ?? []) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/");
        const bucketIndex = pathParts.indexOf("meeting-room-images");
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const path = pathParts.slice(bucketIndex + 1).join("/");
          map.set(url, path);
        }
      } catch {
        // Skip invalid URLs
      }
    }
    return map;
  }, [meetingRoom.meeting_room_images]);

  // Track deleted image paths for cleanup
  const [deletedImagePaths, setDeletedImagePaths] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Cleanup preview URLs on unmount
  useEffect(
    () => () => {
      for (const image of newImages) {
        URL.revokeObjectURL(image.preview);
      }
    },
    [newImages]
  );

  const handleImageDrop = useCallback((acceptedFiles: File[]) => {
    const previews = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...previews]);
  }, []);

  const handleRemoveNewImage = useCallback((index: number) => {
    setNewImages((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleRemoveExistingImage = useCallback(
    (index: number) => {
      setExistingImages((prev) => {
        const removedUrl = prev[index];
        if (removedUrl) {
          const path = urlToPathMap.get(removedUrl);
          if (path) {
            setDeletedImagePaths((prevPaths) => [...prevPaths, path]);
          }
        }
        return prev.filter((_, i) => i !== index);
      });
    },
    [urlToPathMap]
  );

  const handleImageError = useCallback((error: Error) => {
    toast.error(error.message, { duration: 10_000 });
  }, []);

  function handleValidation(
    data: ReturnType<typeof parseFormData>,
    values: FormValues
  ): EditMeetingRoomFormState | null {
    const validation = validateForm(data);
    if (!validation.isValid) {
      toast.error(
        formatErrorForToast({ message: validation.errorMessages.join(". ") }),
        { duration: 10_000 }
      );
      return {
        error: validation.errorMessages.join(". "),
        fieldErrors: validation.fieldErrors,
        success: false,
        values,
      };
    }

    const imageCountValidation = validateImageCount(
      existingImages.length,
      newImages.length
    );
    if (imageCountValidation) {
      toast.error(
        formatErrorForToast({
          message: imageCountValidation.errorMessages.join(". "),
        }),
        { duration: 10_000 }
      );
      return {
        error: imageCountValidation.errorMessages.join(". "),
        fieldErrors: imageCountValidation.fieldErrors,
        success: false,
        values,
      };
    }

    return null;
  }

  async function handleImageUploadAndUpdate(
    data: ReturnType<typeof parseFormData>,
    values: FormValues
  ): Promise<EditMeetingRoomFormState | null> {
    const folderId = generateFolderId();
    const uploadResult = await handleImageUpload(
      folderId,
      newImages,
      setIsUploading
    );

    if (!uploadResult.success) {
      toast.error(
        uploadResult.error ??
          messages.admin.meetingRooms.messages.error.update.imagesUploadFailed
      );
      return {
        error:
          uploadResult.error ??
          messages.admin.meetingRooms.messages.error.update.imagesUploadFailed,
        fieldErrors: { images: true },
        success: false,
        values,
      };
    }

    const finalImageUrls = [...existingImages, ...(uploadResult.urls ?? [])];

    const updateResult = await updateMeetingRoom(meetingRoom.meeting_room_id, {
      ...data,
      meeting_room_images: finalImageUrls,
    });

    if (hasError(updateResult)) {
      toast.error(formatErrorForToast({ message: updateResult.error.message }));
      return {
        error: updateResult.error.message,
        fieldErrors: parseFieldErrors<FieldErrors>(updateResult.error.details),
        success: false,
        values,
      };
    }

    if (!hasData(updateResult)) {
      toast.error(messages.admin.meetingRooms.messages.error.update.notFound);
      return {
        error: messages.admin.meetingRooms.messages.error.update.notFound,
        success: false,
        values,
      };
    }

    return null;
  }

  async function handleCleanupAndAmenities(): Promise<void> {
    if (deletedImagePaths.length > 0) {
      const deleteResult = await deleteMeetingRoomImages(deletedImagePaths);
      if (!deleteResult.success) {
        toast.error(
          deleteResult.error ??
            "Room updated but failed to delete some images from storage"
        );
      }
    }

    const amenitiesResult = await updateMeetingRoomAmenities({
      meeting_room_id: meetingRoom.meeting_room_id,
      amenity_ids: selectedAmenityIds,
    });

    if (!amenitiesResult.success) {
      toast.error(
        messages.admin.meetingRooms.messages.error.update.amenitiesFailed
      );
    }
  }

  async function formAction(
    _previousState: EditMeetingRoomFormState | null,
    formData: FormData
  ): Promise<EditMeetingRoomFormState> {
    const values = extractFormValues(formData);
    const data = parseFormData(values);

    const validationError = handleValidation(data, values);
    if (validationError) {
      return validationError;
    }

    const updateError = await handleImageUploadAndUpdate(data, values);
    if (updateError) {
      return updateError;
    }

    await handleCleanupAndAmenities();

    toast.success(messages.admin.meetingRooms.messages.success.update);
    router.refresh();
    onSuccess?.();

    return { error: null, success: true };
  }

  const [state, formActionHandler, isPending] = useActionState(
    formAction,
    null
  );

  const isLoading = isPending || isUploading;

  const totalImages = existingImages.length + newImages.length;

  return (
    <form action={formActionHandler} className="space-y-6" ref={formRef}>
      <Field>
        <FieldLabel htmlFor="edit-meeting-room-name">
          {messages.admin.meetingRooms.ui.update.nameLabel}
        </FieldLabel>
        <Input
          defaultValue={
            state?.values?.meeting_room_name ?? meetingRoom.meeting_room_name
          }
          disabled={isLoading}
          error={state?.fieldErrors?.meeting_room_name}
          id="edit-meeting-room-name"
          key={state?.values?.meeting_room_name}
          name="meeting_room_name"
          placeholder={messages.admin.meetingRooms.ui.update.namePlaceholder}
          type="text"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="edit-meeting-room-capacity">
          {messages.admin.meetingRooms.ui.update.capacityLabel}
        </FieldLabel>
        <Input
          defaultValue={
            state?.values?.meeting_room_capacity ??
            meetingRoom.meeting_room_capacity
          }
          disabled={isLoading}
          error={state?.fieldErrors?.meeting_room_capacity}
          id="edit-meeting-room-capacity"
          key={state?.values?.meeting_room_capacity}
          name="meeting_room_capacity"
          placeholder={
            messages.admin.meetingRooms.ui.update.capacityPlaceholder
          }
          type="number"
        />
        <FieldDescription>
          {messages.admin.meetingRooms.ui.update.capacityHelper}
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="edit-meeting-room-price">
          {messages.admin.meetingRooms.ui.update.pricePerHourLabel}
        </FieldLabel>
        <Input
          defaultValue={
            state?.values?.meeting_room_price_per_hour ??
            meetingRoom.meeting_room_price_per_hour
          }
          disabled={isLoading}
          error={state?.fieldErrors?.meeting_room_price_per_hour}
          id="edit-meeting-room-price"
          key={state?.values?.meeting_room_price_per_hour}
          name="meeting_room_price_per_hour"
          placeholder={
            messages.admin.meetingRooms.ui.update.pricePerHourPlaceholder
          }
          type="number"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="edit-meeting-room-size">
          {messages.admin.meetingRooms.ui.update.sizeLabel}
        </FieldLabel>
        <Input
          defaultValue={
            state?.values?.meeting_room_size ?? meetingRoom.meeting_room_size
          }
          disabled={isLoading}
          error={state?.fieldErrors?.meeting_room_size}
          id="edit-meeting-room-size"
          key={state?.values?.meeting_room_size}
          name="meeting_room_size"
          placeholder={messages.admin.meetingRooms.ui.update.sizePlaceholder}
          type="number"
        />
      </Field>

      {/* Amenities selection */}
      <Field>
        <FieldLabel>
          {messages.admin.meetingRooms.ui.update.amenitiesLabel}
        </FieldLabel>
        <AmenitySelector
          amenities={allAmenities}
          disabled={isLoading}
          onSelectionChange={setSelectedAmenityIds}
          selectedIds={selectedAmenityIds}
        />
        <FieldDescription>
          {messages.admin.meetingRooms.ui.update.amenitiesHelper}
        </FieldDescription>
      </Field>

      {/* Images */}
      <Field>
        <FieldLabel>
          {messages.admin.meetingRooms.ui.update.imagesLabel}
        </FieldLabel>
        <Dropzone
          accept={{
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
          }}
          disabled={isLoading}
          error={state?.fieldErrors?.images}
          maxFiles={10 - totalImages}
          maxSize={5 * 1024 * 1024}
          onDrop={handleImageDrop}
          onError={handleImageError}
          src={newImages.map((img) => img.file)}
        >
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
        <FieldDescription>
          {messages.admin.meetingRooms.ui.update.imagesHelper}
        </FieldDescription>
      </Field>

      {/* Existing images preview */}
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium text-sm">
            {messages.admin.meetingRooms.ui.update.imagesCurrentLabel}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((url, index) => (
              <div
                className="group relative aspect-video overflow-hidden rounded-md border bg-muted"
                key={url}
              >
                <Image
                  alt={`Room image ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 33vw, 100px"
                  src={url}
                />
                <button
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleRemoveExistingImage(index)}
                  type="button"
                >
                  <XIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New images preview */}
      {newImages.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium text-sm">
            {messages.admin.meetingRooms.ui.update.imagesNewLabel}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {newImages.map((image, index) => (
              <div
                className="group relative aspect-video overflow-hidden rounded-md border bg-muted"
                key={image.preview}
              >
                <Image
                  alt={`New image ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 33vw, 100px"
                  src={image.preview}
                />
                <button
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleRemoveNewImage(index)}
                  type="button"
                >
                  <XIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        className="w-full"
        disabled={isLoading}
        loading={isLoading}
        loadingText={
          isUploading
            ? messages.admin.meetingRooms.ui.update.uploadingImages
            : messages.admin.meetingRooms.ui.update.submitButtonLoading
        }
        type="submit"
      >
        {messages.admin.meetingRooms.ui.update.submitButton}
      </Button>
    </form>
  );
}
