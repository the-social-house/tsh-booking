/**
 * Converts a room name to a URL-friendly slug.
 * Example: "Room of Innovation" → "room-of-innovation"
 *
 * @param roomName - The room name to convert to a slug
 * @returns The slug version of the room name
 */
const WHITESPACE_REGEX = /\s+/;

export function roomNameToSlug(roomName: string): string {
  return roomName.toLowerCase().trim().split(WHITESPACE_REGEX).join("-");
}
