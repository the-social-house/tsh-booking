"use server";

import { requireAdmin } from "@/app/features/auth/lib/require-admin";

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
  // Verify admin access and get Supabase client
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return {
      success: false,
      error:
        authError?.message || "You must be an admin to perform this action",
    };
  }

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
