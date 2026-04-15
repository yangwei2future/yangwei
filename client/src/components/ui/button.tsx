import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/85 active:scale-[0.98]",
        destructive:
          "bg-[oklch(0.55_0.2_25)] text-white hover:bg-[oklch(0.48_0.22_25)] active:scale-[0.98]",
        outline:
          "border border-[oklch(0.87_0.002_286)] bg-white text-[oklch(0.22_0.01_65)] hover:bg-[oklch(0.975_0.001_286)] hover:border-[oklch(0.78_0.003_286)] active:scale-[0.98]",
        secondary:
          "bg-[oklch(0.95_0.002_286)] text-[oklch(0.25_0.01_65)] hover:bg-[oklch(0.91_0.002_286)] active:scale-[0.98]",
        ghost:
          "text-[oklch(0.35_0.01_65)] hover:bg-[oklch(0.96_0.001_286)] hover:text-[oklch(0.15_0.01_65)]",
        link: "text-[oklch(0.46_0.15_255)] underline-offset-4 hover:underline hover:text-[oklch(0.35_0.18_255)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
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
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
