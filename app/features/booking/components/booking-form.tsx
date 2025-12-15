"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createBooking } from "@/app/features/booking/actions/create-booking";
import { createBookingAmenities } from "@/app/features/booking/actions/create-booking-amenities";
import {
  type BookingSlot,
  getBookings,
} from "@/app/features/booking/actions/get-bookings";
import type { CreateBookingInput } from "@/app/features/booking/lib/booking.schema";
import { Button } from "@/components/ui/button";
import { CalendarBooking } from "@/components/ui/calendar-booking";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  type FormState,
  formatErrorForToast,
  parseFieldErrors,
} from "@/lib/form-errors";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";

// Simulated types (will be replaced with actual database types later)
type SimulatedMeetingRoom = {
  meeting_room_id: number;
  meeting_room_name: string;
  meeting_room_capacity: number;
  meeting_room_price_per_hour: number;
  meeting_room_size: number;
};

type SimulatedAmenity = {
  amenity_id: number;
  amenity_name: string;
  amenity_price: number;
};

type SimulatedUser = {
  user_id: number;
  user_email: string;
  subscription_discount?: number; // Discount percentage from subscription
};

type BookingFormProps = {
  meetingRoom: SimulatedMeetingRoom;
  roomAmenities: SimulatedAmenity[]; // Amenities available for this room
  user: SimulatedUser;
  onSuccess?: () => void;
};

type FieldErrors = {
  booking_date?: boolean;
  booking_start_time?: boolean;
  booking_end_time?: boolean;
  booking_number_of_people?: boolean;
};

type BookingFormState = FormState<FieldErrors>;

export default function BookingForm({
  meetingRoom,
  roomAmenities,
  user,
  onSuccess,
}: BookingFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [numberOfPeople, setNumberOfPeople] = useState<string>("");
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [existingBookings, setExistingBookings] = useState<BookingSlot[]>([]);

  // Fetch existing bookings for the room (next 30 days) when component mounts
  useEffect(() => {
    const fetchExistingBookings = async () => {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const result = await getBookings({
        roomId: meetingRoom.meeting_room_id,
        startDate: format(today, "yyyy-MM-dd"),
        endDate: format(thirtyDaysFromNow, "yyyy-MM-dd"),
      });

      if (hasData(result)) {
        setExistingBookings(result.data);
      } else if (hasError(result)) {
        console.error("Failed to fetch existing bookings:", result.error);
        toast.error("Failed to load existing bookings");
      }
    };

    fetchExistingBookings();
  }, [meetingRoom.meeting_room_id]);

  // Get discount from user's subscription (automatic)
  const subscriptionDiscount = user.subscription_discount || 0;

  // Calculate total price including selected amenities
  const calculateTotalPrice = (): {
    roomSubtotal: number;
    amenitiesTotal: number;
    subtotal: number;
    total: number;
  } => {
    if (!(selectedDate && startTime && endTime)) {
      return { roomSubtotal: 0, amenitiesTotal: 0, subtotal: 0, total: 0 };
    }

    const start = new Date(
      `${format(selectedDate, "yyyy-MM-dd")}T${startTime}`
    );
    const end = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (hours <= 0) {
      return { roomSubtotal: 0, amenitiesTotal: 0, subtotal: 0, total: 0 };
    }

    // Room price
    const roomPrice = meetingRoom.meeting_room_price_per_hour * hours;

    // Selected amenities price
    const amenitiesPrice = selectedAmenities.reduce((acc, amenityId) => {
      const amenity = roomAmenities.find((a) => a.amenity_id === amenityId);
      return acc + (amenity?.amenity_price || 0);
    }, 0);

    const priceSubtotal = roomPrice + amenitiesPrice;
    const discountAmount = (priceSubtotal * subscriptionDiscount) / 100;
    const priceTotal = Math.max(0, priceSubtotal - discountAmount);

    return {
      roomSubtotal: roomPrice,
      amenitiesTotal: amenitiesPrice,
      subtotal: priceSubtotal,
      total: priceTotal,
    };
  };

  const {
    roomSubtotal,
    amenitiesTotal,
    subtotal,
    total: totalPrice,
  } = calculateTotalPrice();

  const buildBookingData = (): CreateBookingInput | null => {
    if (!(selectedDate && startTime && endTime)) {
      return null;
    }

    const bookingDate = format(selectedDate, "yyyy-MM-dd");
    const startDateTime = `${bookingDate}T${startTime}:00`;
    const endDateTime = `${bookingDate}T${endTime}:00`;

    return {
      booking_user_id: user.user_id,
      booking_meeting_room_id: meetingRoom.meeting_room_id,
      booking_date: bookingDate,
      booking_start_time: startDateTime,
      booking_end_time: endDateTime,
      booking_number_of_people: Number(numberOfPeople),
      booking_total_price: totalPrice,
      booking_discount: subscriptionDiscount > 0 ? subscriptionDiscount : null,
      booking_payment_status: "pending",
      booking_stripe_transaction_id: null,
      booking_receipt_url: null,
    };
  };

  const handleAmenitiesCreation = async (bookingId: number): Promise<void> => {
    if (selectedAmenities.length === 0) {
      return;
    }

    const amenitiesResult = await createBookingAmenities({
      booking_id: bookingId,
      amenity_ids: selectedAmenities,
    });

    if (hasError(amenitiesResult)) {
      toast.error(
        "Booking created but failed to add amenities: " +
          amenitiesResult.error.message
      );
    }
  };

  async function bookingAction(
    _previousState: BookingFormState | null,
    _formData: FormData
  ): Promise<BookingFormState> {
    const data = buildBookingData();
    if (!data) {
      toast.error("Please select date and times");
      return {
        error: "Date and times are required",
        success: false,
      };
    }

    // TODO: Open Stripe modal here for payment
    // For now, create booking directly
    const result = await createBooking(data);

    if (hasError(result)) {
      toast.error(formatErrorForToast(result.error));
      return {
        error: result.error.message,
        fieldErrors: parseFieldErrors<FieldErrors>(result.error.details),
        success: false,
      };
    }

    if (!hasData(result)) {
      return {
        error: messages.bookings.messages.error.create.unknown,
        success: false,
      };
    }

    // Create booking amenities if any selected
    await handleAmenitiesCreation(result.data.booking_id);

    toast.success(messages.bookings.messages.success.create);
    router.refresh();
    onSuccess?.();
    return {
      error: null,
      success: true,
    };
  }

  const [state, formAction, isPending] = useActionState(bookingAction, null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setSelectedDate(undefined);
      setStartTime("");
      setEndTime("");
      setNumberOfPeople("");
      setSelectedAmenities([]);
    }
  }, [state?.success]);

  const toggleAmenity = (amenityId: number) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{messages.bookings.ui.create.title}</CardTitle>
          <CardDescription>
            {meetingRoom.meeting_room_name} - {meetingRoom.meeting_room_size}m²
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6" ref={formRef}>
            {/* Room Info */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  {messages.bookings.ui.create.roomCapacityLabel}
                </p>
                <p className="font-semibold text-lg">
                  {meetingRoom.meeting_room_capacity} people
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  {messages.bookings.ui.create.roomPriceLabel}
                </p>
                <p className="font-semibold text-lg">
                  ${meetingRoom.meeting_room_price_per_hour.toFixed(2)}/hour
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  {messages.bookings.ui.create.roomSizeLabel}
                </p>
                <p className="font-semibold text-lg">
                  {meetingRoom.meeting_room_size}m²
                </p>
              </div>
            </div>

            {/* Calendar with Date, Start Time, End Time, and Number of People */}
            <CalendarBooking
              date={selectedDate}
              disabled={isPending}
              endHour={22}
              endTime={endTime}
              existingBookings={existingBookings}
              maxCapacity={meetingRoom.meeting_room_capacity}
              numberOfPeople={numberOfPeople}
              onDateChange={setSelectedDate}
              onEndTimeChange={setEndTime}
              onNumberOfPeopleChange={setNumberOfPeople}
              onTimeChange={(time) => setStartTime(time || "")}
              selectedTime={startTime}
              startHour={9}
              timeSlotInterval={30}
            />

            {/* Row 2: Amenities | Price Summary + Button */}
            <div className="grid items-start gap-6 md:grid-cols-2">
              {/* Room Amenities */}
              <Field>
                <FieldLabel>
                  {messages.bookings.ui.create.amenitiesLabel}
                </FieldLabel>
                {roomAmenities.length > 0 ? (
                  <div className="space-y-3">
                    {roomAmenities.map((amenity) => (
                      <div
                        className="flex items-center gap-3"
                        key={amenity.amenity_id}
                      >
                        <Checkbox
                          checked={selectedAmenities.includes(
                            amenity.amenity_id
                          )}
                          disabled={isPending}
                          id={`amenity-${amenity.amenity_id}`}
                          onCheckedChange={() =>
                            toggleAmenity(amenity.amenity_id)
                          }
                        />
                        <label
                          className="flex-1 cursor-pointer text-sm"
                          htmlFor={`amenity-${amenity.amenity_id}`}
                        >
                          {amenity.amenity_name}
                          {amenity.amenity_price > 0 ? (
                            <span className="ml-2 text-muted-foreground">
                              +${amenity.amenity_price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="ml-2 text-green-600">Free</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No amenities available for this room.
                  </p>
                )}
                <FieldDescription>
                  {messages.bookings.ui.create.amenitiesHelper}
                </FieldDescription>
              </Field>

              {/* Price Summary + Button */}
              <div className="space-y-4">
                <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Room</span>
                    <span>${roomSubtotal.toFixed(2)}</span>
                  </div>
                  {amenitiesTotal > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amenities</span>
                      <span>${amenitiesTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t pt-2 text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {subscriptionDiscount > 0 && (
                    <div className="flex items-center justify-between text-green-600 text-sm">
                      <span>
                        Subscription discount ({subscriptionDiscount}%)
                      </span>
                      <span>
                        -${((subtotal * subscriptionDiscount) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-semibold">
                      {messages.bookings.ui.create.totalPriceLabel}
                    </span>
                    <span className="font-bold text-2xl">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Book Button */}
                <Button
                  className="w-full"
                  disabled={isPending || totalPrice === 0 || !numberOfPeople}
                  loading={isPending}
                  loadingText={messages.bookings.ui.create.submitButtonLoading}
                  size="lg"
                  type="submit"
                >
                  {messages.bookings.ui.create.submitButton}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
