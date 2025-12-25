import { redirect } from "next/navigation";
import { getAmenities } from "@/app/features/admin/actions/get-amenities";
import AdminDashboardTabs from "@/app/features/admin/components/admin-dashboard-tabs";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { getMeetingRooms } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import Heading from "@/components/ui/heading";
import { hasData } from "@/lib/supabase-response";

async function AdminPage() {
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
          <Heading as="h1" size="h1">
            Admin panel
          </Heading>
          <AdminDashboardTabs
            allAmenities={allAmenities}
            meetingRoomsPromise={meetingRoomsPromise}
          />
        </>
      }
      variant="full"
    />
  );
}

export default AdminPage;
