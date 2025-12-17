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
  meeting_room_images: z.array(z.url()).default([]),
});

/**
 * Schema for validating meeting room images
 */
export const meetingRoomImagesSchema = z
  .array(z.instanceof(File))
  .min(1, messages.admin.meetingRooms.validation.images.required);

export type CreateMeetingRoomInput = z.infer<typeof createMeetingRoomSchema>;

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
