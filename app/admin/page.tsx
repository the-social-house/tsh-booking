import AdminDashboardTabs from "@/app/features/admin/components/admin-dashboard-tabs";
import { getMeetingRooms } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import Heading from "@/components/ui/heading";

function AdminPage() {
  const meetingRoomsPromise = getMeetingRooms();

  return (
    <TwoColumnLayout
      left={
        <>
          <Heading as="h1" size="h1">
            Admin panel
          </Heading>
          <AdminDashboardTabs meetingRoomsPromise={meetingRoomsPromise} />
        </>
      }
      variant="full"
    />
  );
}

export default AdminPage;
