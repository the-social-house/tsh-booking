import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-primary-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading,
  loadingText,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    loadingText?: string;
  }) {
  // When asChild is true, use simpler rendering to avoid breaking Slot composition
  if (asChild) {
    return (
      <Slot
        className={cn(buttonVariants({ variant, size, className }))}
        data-slot="button"
        {...props}
      >
        {children}
      </Slot>
    );
  }

  const textClassName = loading === true ? "invisible" : undefined;
  const spinnerClassName = loading === true ? undefined : "invisible";

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      {...props}
    >
      {/* Text content - invisible when loading but preserves button width */}
      <span className={cn("contents", textClassName)}>{children}</span>

      {/* Spinner - absolutely positioned, invisible when not loading */}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          spinnerClassName
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>

      {/* Screen reader text for loading state */}
      {loadingText !== undefined && loading === true ? (
        <span className="sr-only">{loadingText}</span>
      ) : null}
    </button>
  );
}

export { Button, buttonVariants };
