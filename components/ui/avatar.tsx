"use client";

import Image from "next/image";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type AvatarProps = ComponentProps<"div">;

const Avatar = ({ className, children, ...props }: AvatarProps) => (
  <div
    className={cn(
      "relative flex size-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    data-slot="avatar"
    {...props}
  >
    {children}
  </div>
);

type AvatarImageProps = Omit<ComponentProps<typeof Image>, "src" | "alt"> & {
  src?: string;
  alt?: string;
};

const AvatarImage = ({ className, src, alt, ...props }: AvatarImageProps) => {
  // Always render to maintain consistent DOM structure for hydration
  // Use a transparent 1x1 pixel data URL when no src is provided
  const imageSrc =
    src ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

  return (
    <Image
      alt={alt || "Avatar"}
      className={cn(
        "absolute inset-0 size-full object-cover",
        !src && "opacity-0",
        className
      )}
      height={40}
      src={imageSrc}
      width={40}
      {...props}
    />
  );
};

type AvatarFallbackProps = ComponentProps<"div">;

const AvatarFallback = ({
  className,
  children,
  ...props
}: AvatarFallbackProps) => (
  <div
    className={cn(
      "flex size-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export { Avatar, AvatarImage, AvatarFallback };
