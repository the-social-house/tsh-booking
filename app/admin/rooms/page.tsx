import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/app/features/admin/components/admin-nav";
import { MeetingRoomsTable } from "@/app/features/admin/components/meeting-rooms/meeting-rooms-table";
import { getAmenities } from "@/app/features/amenities/actions/get-amenities";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { getMeetingRooms } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import messages from "@/lib/messages.json";
import { createPageMetadata } from "@/lib/metadata";
import { hasData } from "@/lib/supabase-response";

export const metadata: Metadata = createPageMetadata(
  messages.metadata.admin.rooms.title,
  messages.metadata.admin.rooms.description
);

async function AdminRoomsPage() {
  // Verify admin access
  const adminResult = await requireAdmin();
  if (adminResult.error || !adminResult.user) {
    redirect("/");
  }

  const meetingRoomsPromise = getMeetingRooms();
  const amenitiesResult = await getAmenities();
  const allAmenities = hasData(amenitiesResult) ? amenitiesResult.data : [];

  return (
    <TwoColumnLayout
      left={
        <>
          <AdminNav />
          <MeetingRoomsTable
            allAmenities={allAmenities}
            meetingRoomsPromise={meetingRoomsPromise}
          />
        </>
      }
      variant="full"
    />
  );
}

export default AdminRoomsPage;
