import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * @example
 * // Left column is 1/3 width, right column is 2/3 width
 * // On mobile: left (smaller) appears first
 * <TwoColumnLayout
 *   variant="left-narrow"
 *   left={<RoomDescription room={room} />}
 *   right={<RoomImage roomId={room.id} />}
 * />
 *
 * @example
 * // Right column is 1/3 width, left column is 2/3 width
 * // On mobile: right (smaller) appears first
 * <TwoColumnLayout
 *   variant="right-narrow"
 *   left={<ArticleContent />}
 *   right={<Sidebar />}
 * />
 *
 * @example
 * // 50/50 split
 * <TwoColumnLayout
 *   variant="equal"
 *   left={<Form />}
 *   right={<Preview />}
 * />
 *
 * @example
 * // Full width (only left column shown)
 * <TwoColumnLayout
 *   variant="full"
 *   left={<FullWidthContent />}
 *   right={null}
 * />
 */

type LayoutVariant = "left-narrow" | "right-narrow" | "equal" | "full";

type TwoColumnLayoutProps = {
  /**
   * Content to display in the left column
   */
  left: ReactNode;
  /**
   * Content to display in the right column
   */
  right: ReactNode;
  /**
   * Layout variant:
   * - "left-narrow": left = 1/3 (4 cols), right = 2/3 (8 cols)
   * - "right-narrow": left = 2/3 (8 cols), right = 1/3 (4 cols)
   * - "equal": 50/50 split (6 cols each)
   * - "full": full width (12 cols, shows only left column)
   * Defaults to "equal"
   */
  variant?: LayoutVariant;
  /**
   * Gap between columns (Tailwind spacing class)
   * Defaults to "gap-6"
   */
  gap?: string;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Additional className for the left column
   */
  leftClassName?: string;
  /**
   * Additional className for the right column
   */
  rightClassName?: string;
};

/**
 * Two-column responsive layout component.
 * Stacks vertically on mobile with smaller column on top, displays side-by-side on larger screens.
 * Uses CSS Grid with predefined variants: 1/3-2/3, 2/3-1/3, 50/50, or full width.
 */
export function TwoColumnLayout({
  left,
  right,
  variant = "equal",
  gap = "gap-10",
  className,
  leftClassName,
  rightClassName,
}: TwoColumnLayoutProps) {
  const { leftSpan, rightSpan, mobileOrder } = getLayoutConfig(variant);

  // For full width variant, only show left column
  if (variant === "full") {
    return (
      <div className={cn("container mx-auto w-full", className)}>
        <div className={cn(leftClassName)}>{left}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "container mx-auto grid w-full",
        // Mobile: stack vertically
        "grid-cols-1",
        // Tablet and up: 12-column grid
        "md:grid-cols-12",
        gap,
        className
      )}
    >
      {/* Left Column */}
      <div
        className={cn(
          // Mobile: full width, order controlled by mobileOrder
          "col-span-1",
          mobileOrder.left,
          // Tablet and up: calculated span
          leftSpan,
          leftClassName
        )}
      >
        {left}
      </div>

      {/* Right Column */}
      <div
        className={cn(
          // Mobile: full width, order controlled by mobileOrder
          "col-span-1",
          mobileOrder.right,
          // Tablet and up: calculated span
          rightSpan,
          rightClassName
        )}
      >
        {right}
      </div>
    </div>
  );
}

/**
 * Get layout configuration based on variant
 */
function getLayoutConfig(variant: LayoutVariant): {
  leftSpan: string;
  rightSpan: string;
  mobileOrder: { left: string; right: string };
} {
  switch (variant) {
    case "left-narrow":
      // Left: 1/3 (4 cols), Right: 2/3 (8 cols)
      // Mobile: left is smaller, so it goes first (default order)
      return {
        leftSpan: "md:col-span-4",
        rightSpan: "md:col-span-8",
        mobileOrder: {
          left: "order-1",
          right: "order-2",
        },
      };

    case "right-narrow":
      // Left: 2/3 (8 cols), Right: 1/3 (4 cols)
      // Mobile: right is smaller, so it goes first (swap order)
      return {
        leftSpan: "md:col-span-8",
        rightSpan: "md:col-span-4",
        mobileOrder: {
          left: "order-2",
          right: "order-1",
        },
      };

    case "equal":
      // 50/50 split (6 cols each)
      // Mobile: order doesn't matter, keep default
      return {
        leftSpan: "md:col-span-6",
        rightSpan: "md:col-span-6",
        mobileOrder: {
          left: "order-1",
          right: "order-2",
        },
      };

    case "full":
      // Full width (shouldn't reach here, handled above)
      return {
        leftSpan: "md:col-span-12",
        rightSpan: "md:col-span-12",
        mobileOrder: {
          left: "order-1",
          right: "order-2",
        },
      };

    default:
      // Fallback to equal
      return {
        leftSpan: "md:col-span-6",
        rightSpan: "md:col-span-6",
        mobileOrder: {
          left: "order-1",
          right: "order-2",
        },
      };
  }
}
