"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-neon text-ink-950 hover:bg-neon-400 shadow-neon-sm hover:shadow-neon active:scale-[0.98]",
        ghost:
          "border border-white/10 hover:border-neon/50 hover:bg-neon/[0.06] active:scale-[0.98]",
        subtle:
          "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
        outline:
          "border border-neon/40 text-neon hover:bg-neon/10 hover:border-neon",
        danger:
          "bg-rose-500/90 text-white hover:bg-rose-500 shadow-md shadow-rose-500/20",
        link: "text-neon hover:underline underline-offset-4 px-0",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
