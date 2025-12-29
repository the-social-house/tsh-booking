import { z } from "zod";

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
  roomId: z.string().uuid("Invalid room ID"),
});

export type GetRoomAmenitiesInput = z.infer<typeof getRoomAmenitiesSchema>;
