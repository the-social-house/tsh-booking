"use server";

import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import messages from "@/lib/messages.json";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      success: false,
      error: authError?.message || messages.common.messages.adminRequired,
    };
  }

  if (!paths || paths.length === 0) {
    return { success: true };
  }

  const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove(paths);

  if (error) {
    return {
      success: false,
      error: `Failed to delete images: ${error.message}`,
    };
  }

  return { success: true };
}
