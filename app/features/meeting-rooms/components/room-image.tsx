import Image from "next/image";

type RoomImageProps = {
  /**
   * Room ID or name to generate a consistent image seed
   */
  roomId: string;
  /**
   * Image width in pixels
   * Defaults to 800
   */
  width?: number;
  /**
   * Image height in pixels
   * Defaults to 600
   */
  height?: number;
  /**
   * Additional className for styling
   */
  className?: string;
  /**
   * Alt text for accessibility
   */
  alt?: string;
};

/**
 * Room image component using Picsum Photos for placeholder images.
 * Uses room ID as seed to ensure consistent images per room.
 */
export function RoomImage({
  roomId,
  width = 800,
  height = 600,
  className,
  alt = "Meeting room",
}: RoomImageProps) {
  // Use room ID as seed for consistent images
  const imageUrl = `https://picsum.photos/seed/room-${roomId}/${width}/${height}`;

  return (
    <div className={className}>
      <Image
        alt={alt}
        className="h-full w-full rounded-lg object-cover"
        height={height}
        src={imageUrl}
        width={width}
      />
    </div>
  );
}
