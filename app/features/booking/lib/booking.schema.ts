import { z } from "zod";
import messages from "@/lib/messages.json";

/**
 * Valid booking types (must match database check constraint)
 * 'booking' = actual booking made by a user
 * 'buffer' = 30-minute buffer slot automatically created after each booking
 */
export type BookingType = "booking" | "buffer";

export const BOOKING_TYPES: [BookingType, ...BookingType[]] = [
  "booking",
  "buffer",
];

/**
 * Schema for creating a new booking
 */
export const createBookingSchema = z
  .object({
    booking_user_id: z.string().uuid("Invalid user ID"),
    booking_meeting_room_id: z.string().uuid("Invalid meeting room ID"),
    booking_date: z
      .string()
      .min(1, messages.bookings.validation.date.required)
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: messages.bookings.validation.date.invalid,
      }),
    booking_start_time: z
      .string()
      .min(1, messages.bookings.validation.startTime.required)
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: messages.bookings.validation.startTime.invalid,
      }),
    booking_end_time: z
      .string()
      .min(1, messages.bookings.validation.endTime.required)
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: messages.bookings.validation.endTime.invalid,
      }),
    booking_is_type_of_booking: z.enum(BOOKING_TYPES, {
      message: "Invalid booking type. Must be 'booking' or 'buffer'.",
    }),
    booking_number_of_people: z
      .number()
      .int(messages.bookings.validation.numberOfPeople.integer)
      .min(1, messages.bookings.validation.numberOfPeople.min),
    booking_total_price: z
      .number()
      .min(0, messages.bookings.validation.totalPrice.min)
      .max(99_999.99, messages.bookings.validation.totalPrice.max),
    booking_discount: z
      .number()
      .min(0, messages.bookings.validation.discount.min)
      .max(100, messages.bookings.validation.discount.max)
      .nullable()
      .optional(),
    booking_payment_status: z
      .string()
      .min(1, messages.bookings.validation.paymentStatus.required)
      .optional()
      .default("pending"),
    booking_stripe_transaction_id: z.string().nullable().optional(),
    booking_receipt_url: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      const startTime = new Date(data.booking_start_time);
      const endTime = new Date(data.booking_end_time);
      return endTime > startTime;
    },
    {
      message: messages.bookings.validation.endTime.afterStart,
      path: ["booking_end_time"],
    }
  );

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Schema for fetching bookings with optional filters
 */
export const getBookingsSchema = z.object({
  roomId: z.string().uuid("Invalid room ID").optional(),
  startDate: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: messages.bookings.validation.date.invalid,
    })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: messages.bookings.validation.date.invalid,
    })
    .optional(),
});

export type GetBookingsInput = z.infer<typeof getBookingsSchema>;
