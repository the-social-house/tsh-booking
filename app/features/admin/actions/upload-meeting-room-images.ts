"use server";

import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET_NAME = "meeting-room-images";

export type UploadResult = {
  success: boolean;
  urls?: string[];
  paths?: string[];
  error?: string;
};

export async function uploadMeetingRoomImages(
  folderId: string,
  formData: FormData
): Promise<UploadResult> {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      success: false,
      error: authError?.message || messages.common.messages.adminRequired,
    };
  }

  const files = formData.getAll("images") as File[];

  if (!files || files.length === 0) {
    return { success: true, urls: [] };
  }

  const uploadedUrls: string[] = [];
  const uploadedPaths: string[] = [];

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

  for (const file of files) {
    // Validate file type
    if (!allowedTypes.has(file.type)) {
      return {
        success: false,
        error: `Invalid file type: ${file.name}. Only JPG, PNG, and WebP images are allowed.`,
      };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${folderId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await supabaseAdmin.storage
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

    // Generate signed URL for private bucket (expires in 1 year = 31,536,000 seconds)
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(data.path, 31_536_000);

    if (signedUrlError || !signedUrlData) {
      return {
        success: false,
        error: `Failed to generate signed URL for ${file.name}: ${signedUrlError?.message ?? "Unknown error"}`,
      };
    }

    uploadedUrls.push(signedUrlData.signedUrl);
    uploadedPaths.push(data.path);
  }

  return {
    success: true,
    urls: uploadedUrls,
    paths: uploadedPaths,
  };
}
