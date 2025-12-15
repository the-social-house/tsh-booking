import { z } from "zod";
import messages from "@/lib/messages.json";

/**
 * Schema for fetching a meeting room by name
 */
export const getMeetingRoomSchema = z.object({
  roomName: z
    .string()
    .min(1, "Room name is required")
    .max(100, "Room name is too long"),
});

export type GetMeetingRoomInput = z.infer<typeof getMeetingRoomSchema>;

/**
 * Schema for fetching room amenities
 */
export const getRoomAmenitiesSchema = z.object({
  roomId: z
    .number()
    .int(messages.bookings.validation.id.integer)
    .positive(messages.bookings.validation.id.positive),
});

export type GetRoomAmenitiesInput = z.infer<typeof getRoomAmenitiesSchema>;
