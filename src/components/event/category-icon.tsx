"use client";

import {
  Activity,
  Baby,
  Bike,
  Droplets,
  Flame,
  Footprints,
  Medal,
  Mountain,
  Waves,
} from "lucide-react";
import type { EventCategory } from "@/types";

const ICON_MAP: Record<EventCategory, React.ComponentType<{ className?: string }>> = {
  marathon: Footprints,
  trail: Mountain,
  ultra: Flame,
  cycling: Bike,
  swimming: Waves,
  triathlon: Activity,
  duathlon: Medal,
  kids: Baby,
  obstacle: Droplets,
};

export function CategoryIcon({
  category,
  className = "h-4 w-4",
}: {
  category: EventCategory;
  className?: string;
}) {
  const Icon = ICON_MAP[category] ?? Footprints;
  return <Icon className={className} />;
}
