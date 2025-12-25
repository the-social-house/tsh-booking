import { z } from "zod";
import messages from "@/lib/messages.json";

/**
 * Schema for creating a new meeting room
 */
export const createMeetingRoomSchema = z.object({
  meeting_room_name: z
    .string()
    .min(1, messages.admin.meetingRooms.validation.name.required)
    .min(2, messages.admin.meetingRooms.validation.name.minLength)
    .max(100, messages.admin.meetingRooms.validation.name.maxLength)
    .trim(),
  meeting_room_capacity: z
    .number()
    .int(messages.admin.meetingRooms.validation.capacity.integer)
    .min(1, messages.admin.meetingRooms.validation.capacity.min)
    .max(1000, messages.admin.meetingRooms.validation.capacity.max),
  meeting_room_price_per_hour: z
    .number()
    .min(1, messages.admin.meetingRooms.validation.pricePerHour.min)
    .max(99_999.99, messages.admin.meetingRooms.validation.pricePerHour.max),
  meeting_room_size: z
    .number()
    .min(1, messages.admin.meetingRooms.validation.size.min)
    .max(99_999.99, messages.admin.meetingRooms.validation.size.max),
  meeting_room_images: z
    .array(z.url())
    .min(1, messages.admin.meetingRooms.validation.images.required)
    .max(10, messages.admin.meetingRooms.validation.images.maxCount)
    .default([])
    .optional(),
});

/**
 * Schema for updating a meeting room (all fields optional)
 */
export const updateMeetingRoomSchema = z.object({
  meeting_room_name: createMeetingRoomSchema.shape.meeting_room_name.optional(),
  meeting_room_capacity:
    createMeetingRoomSchema.shape.meeting_room_capacity.optional(),
  meeting_room_price_per_hour:
    createMeetingRoomSchema.shape.meeting_room_price_per_hour.optional(),
  meeting_room_size: createMeetingRoomSchema.shape.meeting_room_size.optional(),
  meeting_room_images:
    createMeetingRoomSchema.shape.meeting_room_images.optional(),
});

/**
 * Schema for validating meeting room images (client-side File objects)
 */
export const meetingRoomImagesSchema = z
  .array(z.instanceof(File))
  .min(1, messages.admin.meetingRooms.validation.images.required)
  .max(10, messages.admin.meetingRooms.validation.images.maxCount);

export type CreateMeetingRoomInput = z.infer<typeof createMeetingRoomSchema>;
export type UpdateMeetingRoomInput = z.infer<typeof updateMeetingRoomSchema>;

/**
 * Schema for creating a room unavailability period
 */
export const createRoomUnavailabilitySchema = z
  .object({
    unavailable_start_date: z
      .string()
      .min(
        1,
        messages.admin.meetingRooms.validation.availability.startDate.required
      )
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message:
          messages.admin.meetingRooms.validation.availability.startDate.invalid,
      }),
    unavailable_end_date: z
      .string()
      .min(
        1,
        messages.admin.meetingRooms.validation.availability.endDate.required
      )
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message:
          messages.admin.meetingRooms.validation.availability.endDate.invalid,
      }),
    unavailability_reason: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.unavailable_start_date);
      const endDate = new Date(data.unavailable_end_date);
      return endDate >= startDate;
    },
    {
      message:
        messages.admin.meetingRooms.validation.availability.endDate.afterStart,
      path: ["unavailable_end_date"],
    }
  );

/**
 * Schema for updating a room unavailability period (all fields optional)
 */
export const updateRoomUnavailabilitySchema = z
  .object({
    unavailable_start_date:
      createRoomUnavailabilitySchema.shape.unavailable_start_date.optional(),
    unavailable_end_date:
      createRoomUnavailabilitySchema.shape.unavailable_end_date.optional(),
    unavailability_reason: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // If both dates are provided, validate range
      if (data.unavailable_start_date && data.unavailable_end_date) {
        const startDate = new Date(data.unavailable_start_date);
        const endDate = new Date(data.unavailable_end_date);
        return endDate >= startDate;
      }
      return true;
    },
    {
      message:
        messages.admin.meetingRooms.validation.availability.endDate.afterStart,
      path: ["unavailable_end_date"],
    }
  );

export type CreateRoomUnavailabilityInput = z.infer<
  typeof createRoomUnavailabilitySchema
>;
export type UpdateRoomUnavailabilityInput = z.infer<
  typeof updateRoomUnavailabilitySchema
>;

/**
 * Schema for validating meeting room IDs (used for update/delete)
 */
export const meetingRoomIdSchema = z.object({
  id: z
    .number()
    .int(messages.admin.meetingRooms.validation.id.integer)
    .positive(messages.admin.meetingRooms.validation.id.positive),
});

export type MeetingRoomIdInput = z.infer<typeof meetingRoomIdSchema>;
