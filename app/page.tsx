import { getBookingSlotsWithUser } from "@/app/features/booking/actions/get-booking-slots-with-user";
import { getRoomUnavailabilitiesOverview } from "@/app/features/booking/actions/get-room-unavailabilities-overview";
import { HomepageBookingOverview } from "@/app/features/booking/components/homepage-booking-overview";
import { getMeetingRooms } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";

export default function Home() {
  const bookingsPromise = getBookingSlotsWithUser();
  const meetingRoomsPromise = getMeetingRooms();
  const unavailabilitiesPromise = getRoomUnavailabilitiesOverview();

  return (
    <TwoColumnLayout
      left={
        <HomepageBookingOverview
          bookingsPromise={bookingsPromise}
          meetingRoomsPromise={meetingRoomsPromise}
          unavailabilitiesPromise={unavailabilitiesPromise}
        />
      }
      variant="full"
    />
  );
}
