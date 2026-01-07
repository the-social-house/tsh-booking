import { getUserUpcomingBookings } from "@/app/features/booking/actions/get-user-upcoming-bookings";
import { MyBookingsTable } from "@/app/features/booking/components/my-bookings-table";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import Heading from "@/components/ui/heading";

export default async function MyBookingsPage() {
  const bookingsPromise = getUserUpcomingBookings();

  return (
    <TwoColumnLayout
      left={
        <Heading as="h1" size="h1">
          My Bookings
        </Heading>
      }
      right={<MyBookingsTable bookingsPromise={bookingsPromise} />}
    />
  );
}
