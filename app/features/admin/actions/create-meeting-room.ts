"use server";

import { getCreateMeetingRoomErrorMessage } from "@/app/features/admin/lib/error-messages";
import {
  type CreateMeetingRoomInput,
  createMeetingRoomSchema,
} from "@/app/features/admin/lib/meeting-room.schema";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseMutationResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { Tables, TablesInsert } from "@/supabase/types/database";

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

async function uploadImages(files: File[]): Promise<{
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
    // Convert ArrayBuffer to Uint8Array for better compatibility
    const uint8Array = new Uint8Array(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, uint8Array, {
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
    } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    uploadedUrls.push(publicUrl);
    uploadedPaths.push(data.path);
  }

  return {
    success: true,
    urls: uploadedUrls,
    paths: uploadedPaths,
  };
}

async function deleteImages(paths: string[]): Promise<void> {
  if (!paths || paths.length === 0) {
    return;
  }

  await supabaseAdmin.storage.from(BUCKET_NAME).remove(paths);
}

async function handleImageUploadAndCleanup(
  imageFiles: File[] | undefined
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

  const uploadResult = await uploadImages(imageFiles);

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
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      data: null,
      error: authError || {
        code: "FORBIDDEN",
        message: messages.common.messages.adminRequired,
        details: "",
        hint: "",
        name: "AuthError",
      },
    };
  }

  const imageUploadResult = await handleImageUploadAndCleanup(imageFiles);

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
      await deleteImages(uploadedImagePaths);
    }
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  const validatedData = validationResult.data;

  const result = await supabaseAdmin
    .from("meeting_rooms")
    .insert(validatedData as TablesInsert<"meeting_rooms">)
    .select()
    .single();

  if (result.error) {
    if (uploadedImagePaths.length > 0) {
      await deleteImages(uploadedImagePaths);
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
