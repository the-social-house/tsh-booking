import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-thin leading-tight tracking-tight", {
  variants: {
    size: {
      h1: "text-2xl md:text-3xl",
      h2: "text-xl md:text-2xl",
      h3: "text-lg md:text-xl",
      h4: "text-md md:text-lg",
      h5: "text-base",
      h6: "text-sm",
    },
  },
  defaultVariants: {
    size: "h1",
  },
});

type HeadingProps = ComponentProps<"h1"> &
  VariantProps<typeof headingVariants> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    eyebrow?: string;
  };

function Heading({ className, size, as, eyebrow, ...props }: HeadingProps) {
  const Comp = as ?? "h2";

  const headingElement = (
    <Comp className={cn(headingVariants({ size }), className)} {...props} />
  );

  if (eyebrow) {
    return (
      <div className="flex flex-col">
        <span className="font-normal text-muted-foreground text-xs uppercase tracking-wider">
          {eyebrow}
        </span>
        {headingElement}
      </div>
    );
  }

  return headingElement;
}

export default Heading;
