"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-10 w-full appearance-none rounded-full bg-white/5 border border-white/10 pl-4 pr-9 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon/40 focus:border-neon/60 transition-all cursor-pointer",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="bg-ink-900 text-white">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-ink-900 text-white"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50"
          aria-hidden
        />
      </div>
    );
  },
);
Select.displayName = "Select";
