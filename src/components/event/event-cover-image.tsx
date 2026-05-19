"use client";

import { EventCoverArt } from "@/components/event/event-cover-art";
import { categoryLabel } from "@/lib/analytics";
import { resolveEventCategory } from "@/lib/event-category";
import { cn } from "@/lib/utils";
import type { SportEvent } from "@/types";

export type EventCoverImageVariant = "card" | "hero" | "thumb";

export type EventCoverImageEvent = Pick<
  SportEvent,
  "id" | "category" | "city" | "title" | "description"
>;

export type EventCoverImageProps = {
  alt: string;
  titleHint?: string;
  className?: string;
  variant?: EventCoverImageVariant;
  event?: EventCoverImageEvent;
};

export function EventCoverImage({
  alt,
  titleHint,
  className,
  variant = "card",
  event,
}: EventCoverImageProps) {
  const title = alt.trim() || "Подія";
  const compact = variant === "thumb";
  const category = event
    ? resolveEventCategory({
        category: event.category,
        title: event.title || title,
        description: event.description,
      })
    : "marathon";
  const label =
    titleHint ??
    (event ? `${title} · ${categoryLabel(category)} · ${event.city}` : title);

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <EventCoverArt
        seed={event?.id ?? title}
        category={category}
        city={event?.city ?? ""}
        compact={compact}
        className="absolute inset-0"
      />
    </div>
  );
}
