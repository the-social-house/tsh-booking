import { z } from "zod";
import messages from "@/lib/messages.json";

/**
 * Schema for fetching a meeting room by name
 */
export const getMeetingRoomSchema = z.object({
  roomName: z
    .string()
    .min(1, messages.admin.meetingRooms.validation.name.required)
    .max(100, messages.admin.meetingRooms.validation.name.maxLength),
});

export type GetMeetingRoomInput = z.infer<typeof getMeetingRoomSchema>;

/**
 * Schema for fetching room amenities
 */
export const getRoomAmenitiesSchema = z.object({
  roomId: z.string().uuid(messages.admin.meetingRooms.validation.id.uuid),
});

export type GetRoomAmenitiesInput = z.infer<typeof getRoomAmenitiesSchema>;
