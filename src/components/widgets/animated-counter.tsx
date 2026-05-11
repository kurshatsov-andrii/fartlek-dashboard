"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { formatNumber } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.4,
  format,
  className,
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  // `formatNumber` детермінований (без Intl/локалю), щоб SSR і клієнт
  // віддавали однаковий текст і не ламали hydration.
  const text = format ? format(Math.round(display)) : formatNumber(display);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
