import Image from "next/image";
import { cn } from "@/lib/utils";

type RoomImageProps = Readonly<{
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
  /**
   * Image source URL
   */
  src: string;
}>;

/**
 * Room image component using Picsum Photos for placeholder images.
 * Uses room ID as seed to ensure consistent images per room.
 */
export function RoomImage({
  width = 800,
  height = 600,
  className,
  alt = "Meeting room",
  src,
}: RoomImageProps) {
  // Use room ID as seed for consistent images

  return (
    <div className={className}>
      <Image
        alt={alt}
        className={cn("h-full w-full object-cover", className)}
        height={height}
        src={src}
        width={width}
      />
    </div>
  );
}
