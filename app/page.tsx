import { getBookingSlotsWithUser } from "@/app/features/booking/actions/get-booking-slots-with-user";
import { getRoomUnavailabilitiesOverview } from "@/app/features/booking/actions/get-room-unavailabilities-overview";
import { getUserUpcomingBookings } from "@/app/features/booking/actions/get-user-upcoming-bookings";
import { HomepageBookingOverview } from "@/app/features/booking/components/homepage-booking-overview";
import { UpcomingBookingsTable } from "@/app/features/booking/components/upcoming-bookings-table";
import { getMeetingRooms } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { RoomsCarousel } from "@/app/features/meeting-rooms/components/rooms-carousel";
import { getCurrentUserData } from "@/app/features/users/actions/get-current-user-data";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import Heading from "@/components/ui/heading";
import messages from "@/lib/messages.json";
import { hasData } from "@/lib/supabase-response";

export default async function Home() {
  const bookingsPromise = getBookingSlotsWithUser();
  const meetingRoomsPromise = getMeetingRooms();
  const unavailabilitiesPromise = getRoomUnavailabilitiesOverview();
  const userBookingsPromise = getUserUpcomingBookings();
  const userPromise = getCurrentUserData();
  const userResult = await userPromise;
  const user = hasData(userResult) ? userResult.data : null;

  return (
    <div className="space-y-20">
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
      <TwoColumnLayout
        left={
          <Heading
            as="h2"
            eyebrow={messages.bookings.ui.upcomingBookings.eyebrow}
            size="h1"
          >
            {user?.user_company_name || "You"}
          </Heading>
        }
        right={<UpcomingBookingsTable bookingsPromise={userBookingsPromise} />}
      />
      <TwoColumnLayout
        left={
          <RoomsCarousel
            roomsPromise={meetingRoomsPromise}
            userPromise={Promise.resolve(userResult)}
          />
        }
        variant="full"
      />
    </div>
  );
}
