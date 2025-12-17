"use server";

import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "meeting-room-images";

export type UploadResult = {
  success: boolean;
  urls?: string[];
  error?: string;
};

export async function uploadMeetingRoomImages(
  folderId: string,
  formData: FormData
): Promise<UploadResult> {
  const files = formData.getAll("images") as File[];

  if (!files || files.length === 0) {
    return { success: true, urls: [] };
  }

  const uploadedUrls: string[] = [];

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  for (const file of files) {
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
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

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    uploadedUrls.push(publicUrl);
  }

  return {
    success: true,
    urls: uploadedUrls,
  };
}
