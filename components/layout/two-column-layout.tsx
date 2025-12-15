import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
   * Fraction of width for left column (e.g., 1 = 50%, 2 = 66.67%)
   * Defaults to 1 (50/50 split)
   */
  leftFraction?: number;
  /**
   * Fraction of width for right column (e.g., 1 = 50%, 2 = 66.67%)
   * Defaults to 1 (50/50 split)
   */
  rightFraction?: number;
  /**
   * Whether the left column should span full width (overrides leftFraction)
   * Defaults to false
   */
  leftFullWidth?: boolean;
  /**
   * Whether the right column should span full width (overrides rightFraction)
   * Defaults to false
   */
  rightFullWidth?: boolean;
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
 * Stacks vertically on mobile, displays side-by-side on larger screens.
 * Uses CSS Grid with configurable fractions for column widths.
 */
export function TwoColumnLayout({
  left,
  right,
  leftFraction = 1,
  rightFraction = 1,
  leftFullWidth = false,
  rightFullWidth = false,
  gap = "gap-6",
  className,
  leftClassName,
  rightClassName,
}: TwoColumnLayoutProps) {
  const totalFraction = leftFraction + rightFraction;
  const leftSpan = leftFullWidth
    ? "md:col-span-12"
    : getColSpanClass(leftFraction, totalFraction);
  const rightSpan = rightFullWidth
    ? "md:col-span-12"
    : getColSpanClass(rightFraction, totalFraction);

  return (
    <div
      className={cn(
        "grid w-full",
        // Mobile: stack vertically
        "grid-cols-1",
        // Tablet and up: 12-column grid for flexibility
        "md:grid-cols-12",
        gap,
        className
      )}
    >
      {/* Left Column */}
      <div
        className={cn(
          // Mobile: full width
          "col-span-1",
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
          // Mobile: full width
          "col-span-1",
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
 * Helper function to get Tailwind col-span class based on fraction
 * Maps fractions to Tailwind's 12-column grid system
 * Ensures columns always add up to exactly 12
 */
function getColSpanClass(fraction: number, totalFraction: number): string {
  // Calculate the exact number of columns (out of 12) this fraction should occupy
  const colSpan = Math.round((fraction / totalFraction) * 12);

  // Clamp between 1 and 12
  const clampedSpan = Math.max(1, Math.min(12, colSpan));

  // Map to Tailwind classes (must be explicit for purging)
  const colSpanMap: Record<number, string> = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
    7: "md:col-span-7",
    8: "md:col-span-8",
    9: "md:col-span-9",
    10: "md:col-span-10",
    11: "md:col-span-11",
    12: "md:col-span-12",
  };

  return colSpanMap[clampedSpan] ?? "md:col-span-6";
}
