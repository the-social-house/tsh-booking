"use server";

import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "meeting-room-images";

export type DeleteResult = {
  success: boolean;
  error?: string;
};

/**
 * Delete images from Supabase storage by their paths
 * Used to cleanup orphaned images when room creation fails
 */
export async function deleteMeetingRoomImages(
  paths: string[]
): Promise<DeleteResult> {
  if (!paths || paths.length === 0) {
    return { success: true };
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);

  if (error) {
    return {
      success: false,
      error: `Failed to delete images: ${error.message}`,
    };
  }

  return { success: true };
}
