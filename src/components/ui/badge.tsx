import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-white/5 border-white/10 text-white/80",
        neon: "bg-neon/15 border-neon/40 text-neon shadow-[0_0_12px_rgba(255,102,51,0.25)]",
        success: "bg-emerald-500/15 border-emerald-400/40 text-emerald-300",
        warning: "bg-amber-500/15 border-amber-400/40 text-amber-300",
        danger: "bg-rose-500/15 border-rose-400/40 text-rose-300",
        info: "bg-sky-500/15 border-sky-400/40 text-sky-300",
        purple: "bg-purple-500/15 border-purple-400/40 text-purple-300",
        muted: "bg-white/[0.03] border-white/[0.08] text-white/60",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
