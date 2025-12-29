import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap border px-2 py-0.5 font-medium text-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        paid: "border-green-500 bg-green-200 text-foreground focus-visible:ring-green-500/20 dark:bg-green-500/60 dark:focus-visible:ring-green-500/40 [a&]:hover:bg-green-500/90",
        pending:
          "border-amber-500 bg-amber-200 text-foreground focus-visible:ring-amber-500/20 dark:bg-amber-500/60 dark:focus-visible:ring-amber-500/40 [a&]:hover:bg-amber-500/90",
        cancelled:
          "border-red-500 bg-red-200 text-foreground focus-visible:ring-red-500/20 dark:bg-red-500/60 dark:focus-visible:ring-red-500/40 [a&]:hover:bg-red-500/90",
        confirmed:
          "border-blue-500 bg-blue-200 text-foreground focus-visible:ring-blue-500/20 dark:bg-blue-500/60 dark:focus-visible:ring-blue-500/40 [a&]:hover:bg-blue-500/90",
      },
      pill: {
        true: "rounded-full",
        false: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      pill: false,
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  pill,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean; pill?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      className={cn(badgeVariants({ variant, pill }), className)}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge, badgeVariants };
