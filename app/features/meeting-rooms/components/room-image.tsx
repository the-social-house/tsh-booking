import Image from "next/image";
import { cn } from "@/lib/utils";

type RoomImageProps = Readonly<{
  className?: string;
  /**
   * Alt text for accessibility
   */
  alt?: string;
  /**
   * Image source URL
   */
  src: string;
  /**
   * Image aspect ratio
   * Defaults to "3/4"
   */
  imageAspectRatio: string;
}>;

/**
 * Room image component using Picsum Photos for placeholder images.
 * Uses room ID as seed to ensure consistent images per room.
 */
export function RoomImage({
  className,
  alt = "Meeting room",
  src,
  imageAspectRatio = "3/4",
}: RoomImageProps) {
  return (
    <div
      className={cn("relative", className)}
      style={{ aspectRatio: imageAspectRatio }}
    >
      <Image
        alt={alt}
        className={cn("absolute size-full rounded object-cover", className)}
        fill
        src={src}
      />
    </div>
  );
}
