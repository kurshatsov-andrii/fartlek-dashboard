"use client";

import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@/types";
import {
  CalendarClock,
  CheckCircle2,
  Flame,
  Hourglass,
  Lock,
} from "lucide-react";

const STATUS_MAP: Record<
  EventStatus,
  {
    label: string;
    variant: React.ComponentProps<typeof Badge>["variant"];
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  registration_open: {
    label: "Реєстрація відкрита",
    variant: "neon",
    icon: Flame,
  },
  soon: { label: "Незабаром", variant: "warning", icon: Hourglass },
  finished: { label: "Завершено", variant: "muted", icon: CheckCircle2 },
  sold_out: { label: "Місць немає", variant: "danger", icon: Lock },
};

export function StatusBadge({ status }: { status: EventStatus }) {
  const cfg = STATUS_MAP[status];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="bg-ink-950/70 backdrop-blur">
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

export const STATUS_LABEL: Record<EventStatus, string> = {
  registration_open: "Реєстрація відкрита",
  soon: "Незабаром",
  finished: "Завершено",
  sold_out: "Місць немає",
};

export { CalendarClock };
