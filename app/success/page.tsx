import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  type BookingWithDetails,
  getBookingById,
} from "@/app/features/booking/actions/get-booking-by-id";
import { RoomImage } from "@/app/features/meeting-rooms/components/room-image";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import { Button } from "@/components/ui/button";
import ErrorFallback from "@/components/ui/error-fallback";
import Heading from "@/components/ui/heading";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime } from "@/lib/format-date-time";
import { formatPrice } from "@/lib/format-price";
import messages from "@/lib/messages.json";
import { createPageMetadata } from "@/lib/metadata";
import { hasData, hasError } from "@/lib/supabase-response";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata(
    messages.metadata.success.title,
    messages.metadata.success.description
  );
}

export default async function SuccessPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ bookingId?: string }>;
}>) {
  const params = await searchParams;
  const bookingId = params.bookingId;

  if (!bookingId) {
    redirect("/");
  }

  return (
    <Suspense fallback={<SuccessPageSkeleton />}>
      <SuccessPageContent bookingId={bookingId} />
    </Suspense>
  );
}

async function SuccessPageContent({
  bookingId,
}: Readonly<{ bookingId: string }>) {
  const bookingResult = await getBookingById(bookingId);

  if (hasError(bookingResult) || !hasData(bookingResult)) {
    if (bookingResult.error?.code === "PGRST116") {
      notFound();
    }

    return (
      <ErrorFallback
        description={
          bookingResult.error?.message ||
          "Failed to load booking details. Please try again later."
        }
        title="Error loading booking"
      />
    );
  }

  const booking = bookingResult.data;
  const meetingRoom = booking.meeting_rooms;
  const user = booking.users;

  if (!(meetingRoom && user)) {
    return (
      <ErrorFallback
        description="Booking data is incomplete. Please contact support."
        title="Invalid booking data"
      />
    );
  }

  // Get first room image
  const roomImages = meetingRoom.meeting_room_images ?? [];
  const firstImage = roomImages.length > 0 ? roomImages[0] : null;

  return (
    <div className="flex items-center justify-center md:h-[calc(100vh-var(--header-height)-var(--spacing)*20)]">
      <TwoColumnLayout
        left={
          <div className="hidden h-full overflow-hidden md:block">
            {firstImage ? (
              <RoomImage
                alt={meetingRoom.meeting_room_name}
                className="flex justify-center"
                imageAspectRatio="3/4"
                src={firstImage}
              />
            ) : null}
          </div>
        }
        right={
          <section className="flex h-full flex-col justify-center gap-10">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="size-8 text-green-500" />
              <Heading
                as="h1"
                eyebrow={messages.bookings.ui.success.eyebrow}
                size="h3"
              >
                {messages.bookings.ui.success.title}
              </Heading>
            </div>
            <BookingEmailDetails email={user.user_email} />
            <div className="grid gap-4">
              <BookingDetails booking={booking} meetingRoom={meetingRoom} />
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/">
                    {messages.bookings.ui.success.backToHome}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/rooms">
                    {messages.bookings.ui.success.viewBookings}
                  </Link>
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              {messages.bookings.ui.success.bookingIdLabel}:{" "}
              {booking.booking_id}
            </p>
          </section>
        }
        variant="equal"
      />
    </div>
  );
}

function BookingDetails({
  booking,
  meetingRoom,
}: Readonly<{
  booking: BookingWithDetails;
  meetingRoom: NonNullable<BookingWithDetails["meeting_rooms"]>;
}>) {
  return (
    <div className="space-y-4">
      <Heading as="h2" size="h3">
        {messages.bookings.ui.success.detailsTitle}
      </Heading>
      <div className="flex flex-wrap gap-2">
        <BookingDetailEntry
          label={messages.bookings.ui.success.labels.room}
          value={meetingRoom.meeting_room_name}
        />
        <BookingDetailEntry
          label={messages.bookings.ui.success.labels.date}
          value={formatDate(new Date(booking.booking_date))}
        />
        <BookingDetailEntry
          label={messages.bookings.ui.success.labels.time}
          value={`${formatTime(booking.booking_start_time)} - ${formatTime(booking.booking_end_time)}`}
        />
        <BookingDetailEntry
          label={messages.bookings.ui.success.labels.numberOfPeople}
          value={booking.booking_number_of_people.toString()}
        />
        <BookingDetailEntry
          label={messages.bookings.ui.success.labels.totalPrice}
          value={`${formatPrice(booking.booking_total_price)} ${messages.common.units.currency}`}
        />
        {(booking.booking_discount ?? 0) > 0 ? (
          <BookingDetailEntry
            label={messages.bookings.ui.success.labels.discountApplied}
            value={`${booking.booking_discount} ${messages.common.units.percent}`}
          />
        ) : null}
      </div>
      {(booking.booking_amenities?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          <Heading as="h3" size="h3">
            {messages.bookings.ui.success.amenitiesTitle}
          </Heading>
          <div className="flex flex-wrap gap-2">
            {booking.booking_amenities
              .map((ba) => ba.amenities)
              .filter(
                (
                  amenity
                ): amenity is NonNullable<
                  BookingWithDetails["booking_amenities"][number]["amenities"]
                > => amenity !== null
              )
              .map((amenity) => (
                <BookingDetailEntry
                  key={amenity.amenity_id}
                  label={amenity.amenity_name}
                  value={
                    amenity.amenity_price !== null && amenity.amenity_price > 0
                      ? `${formatPrice(amenity.amenity_price)} ${messages.common.units.currency}`
                      : messages.common.words.free
                  }
                />
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BookingDetailEntry({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid w-fit rounded border bg-muted p-1.5">
      <p className="font-medium text-sm">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function BookingEmailDetails({ email }: Readonly<{ email: string }>) {
  return (
    <div className="grid w-fit gap-2 rounded-md border border-green-500 bg-green-200 p-2 text-sm">
      <p>
        {messages.bookings.ui.success.emailNotice} {email}
      </p>
    </div>
  );
}

function SuccessPageSkeleton() {
  return (
    <div>
      <div>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
      <Skeleton />
      <TwoColumnLayout
        left={<Skeleton />}
        right={<Skeleton />}
        variant="left-narrow"
      />
      <div>
        <Skeleton />
        <Skeleton />
      </div>
    </div>
  );
}
