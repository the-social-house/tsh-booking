import { redirect } from "next/navigation";
import AdminDashboardTabs from "@/app/features/admin/components/admin-dashboard-tabs";
import { getAmenities } from "@/app/features/amenities/actions/get-amenities";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { getMeetingRooms } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import { hasData } from "@/lib/supabase-response";

async function AdminPage() {
  // Verify admin access
  const adminResult = await requireAdmin();
  if (adminResult.error || !adminResult.user) {
    redirect("/");
  }

  const meetingRoomsPromise = getMeetingRooms();
  const amenitiesPromise = getAmenities();
  const amenitiesResult = await getAmenities();

  const allAmenities = hasData(amenitiesResult) ? amenitiesResult.data : [];

  return (
    <TwoColumnLayout
      left={
        <AdminDashboardTabs
          allAmenities={allAmenities}
          amenitiesPromise={amenitiesPromise}
          meetingRoomsPromise={meetingRoomsPromise}
        />
      }
      variant="full"
    />
  );
}

export default AdminPage;
