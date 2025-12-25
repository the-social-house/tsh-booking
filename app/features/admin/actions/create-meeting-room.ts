"use server";

import { getCreateMeetingRoomErrorMessage } from "@/app/features/admin/lib/error-messages";
import {
  type CreateMeetingRoomInput,
  createMeetingRoomSchema,
} from "@/app/features/admin/lib/meeting-room.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import type { createClient } from "@/lib/supabase/server";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables } from "@/supabase/types/database";

const BUCKET_NAME = "meeting-room-images";

function getFieldForDatabaseError(errorCode: string): string | null {
  const fieldMap: Record<string, string> = {
    // 23505 = unique violation - meeting_room_name is the only unique field
    "23505": "meeting_room_name",
  };
  return fieldMap[errorCode] ?? null;
}

function generateFolderId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

async function uploadImages(
  files: File[],
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{
  success: boolean;
  urls?: string[];
  paths?: string[];
  error?: string;
}> {
  if (!files || files.length === 0) {
    return { success: true, urls: [], paths: [] };
  }

  const uploadedUrls: string[] = [];
  const uploadedPaths: string[] = [];
  const folderId = generateFolderId();
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type: ${file.name}. Only JPG, PNG, and WebP images are allowed.`,
      };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${folderId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: `Failed to upload ${file.name}: ${error.message}`,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    uploadedUrls.push(publicUrl);
    uploadedPaths.push(data.path);
  }

  return {
    success: true,
    urls: uploadedUrls,
    paths: uploadedPaths,
  };
}

async function deleteImages(
  paths: string[],
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  if (!paths || paths.length === 0) {
    return;
  }

  await supabase.storage.from(BUCKET_NAME).remove(paths);
}

async function handleImageUploadAndCleanup(
  imageFiles: File[] | undefined,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{
  success: boolean;
  urls: string[];
  paths: string[];
  error?: {
    code: string;
    message: string;
    details: string;
    hint: string;
    name: string;
  };
}> {
  if (!imageFiles || imageFiles.length === 0) {
    return { success: true, urls: [], paths: [] };
  }

  const uploadResult = await uploadImages(imageFiles, supabase);

  if (!uploadResult.success) {
    return {
      success: false,
      urls: [],
      paths: [],
      error: {
        code: "IMAGE_UPLOAD_ERROR",
        message: uploadResult.error ?? "Failed to upload images",
        details: "",
        hint: "",
        name: "ImageUploadError",
      },
    };
  }

  return {
    success: true,
    urls: uploadResult.urls ?? [],
    paths: uploadResult.paths ?? [],
  };
}

function prepareRoomData(
  data: CreateMeetingRoomInput,
  uploadedImageUrls: string[]
): CreateMeetingRoomInput {
  return {
    ...data,
    meeting_room_images:
      uploadedImageUrls.length > 0
        ? uploadedImageUrls
        : (data.meeting_room_images ?? []),
  };
}

export async function createMeetingRoom(
  data: CreateMeetingRoomInput,
  imageFiles?: File[]
) {
  // Verify admin access and get Supabase client
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return {
      data: null,
      error: authError || {
        code: "FORBIDDEN",
        message: "You must be an admin to perform this action",
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  const imageUploadResult = await handleImageUploadAndCleanup(
    imageFiles,
    supabase
  );

  if (!imageUploadResult.success) {
    return {
      data: null,
      error: imageUploadResult.error ?? {
        code: "IMAGE_UPLOAD_ERROR",
        message: "Failed to upload images",
        details: "",
        hint: "",
        name: "ImageUploadError",
      },
    };
  }

  const { urls: uploadedImageUrls, paths: uploadedImagePaths } =
    imageUploadResult;

  const roomData = prepareRoomData(data, uploadedImageUrls);

  const validationResult = createMeetingRoomSchema.safeParse(roomData);

  if (!validationResult.success) {
    if (uploadedImagePaths.length > 0) {
      await deleteImages(uploadedImagePaths, supabase);
    }
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  const validatedData = validationResult.data;

  const result = await supabase
    .from("meeting_rooms")
    .insert(validatedData)
    .select()
    .single();

  if (result.error) {
    if (uploadedImagePaths.length > 0) {
      await deleteImages(uploadedImagePaths, supabase);
    }

    const errorMessage = getCreateMeetingRoomErrorMessage(result.error.code);
    const errorField = getFieldForDatabaseError(result.error.code);

    const details = errorField
      ? JSON.stringify([{ path: [errorField], message: errorMessage }])
      : result.error.details;

    return {
      data: null,
      error: { ...result.error, message: errorMessage, details },
    };
  }

  return toSupabaseMutationResponse<Tables<"meeting_rooms">>(result);
}
