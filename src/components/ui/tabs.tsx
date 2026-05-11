"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  id: string;
}
const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const current = value ?? internal;
  const id = React.useId();

  const setValue = (next: string) => {
    setInternal(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value: current, setValue, id }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-full glass border-white/10",
        className,
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used inside Tabs");
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 z-10",
        active ? "text-ink-950" : "text-white/70 hover:text-white",
        "light:" + (active ? "text-ink-950" : "text-black/70 hover:text-black"),
        className,
      )}
    >
      {active && (
        <motion.span
          layoutId={`tab-pill-${ctx.id}`}
          className="absolute inset-0 rounded-full bg-neon shadow-neon-sm -z-10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used inside Tabs");
  if (ctx.value !== value) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={className}
      role="tabpanel"
    >
      {children}
    </motion.div>
  );
}
