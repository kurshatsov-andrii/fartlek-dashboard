"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, Eye, Heart, MapPin, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/components/providers/favorites-provider";
import { categoryLabel } from "@/lib/analytics";
import { resolveEventCategory } from "@/lib/event-category";
import { formatEventDate, fromNow } from "@/lib/date";
import { sortDistancesDisplayLine } from "@/lib/distance-sort";
import { organizerLatinInitials } from "@/lib/organizer-initials";
import { FARTLEK_PUBLIC_TELEGRAM_URL } from "@/lib/fartlek-telegram-public";
import { compactNumber } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { CategoryIcon } from "./category-icon";
import type { SportEvent } from "@/types";
import { ShareButton } from "@/components/widgets/share-button";
import { EventCoverImage } from "./event-cover-image";
import { sportEventPagePath } from "@/lib/event-detail";

interface EventCardProps {
  event: SportEvent;
}

export function EventCard({ event }: EventCardProps) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(event.id);
  const category = resolveEventCategory(event);
  const distanceLine = sortDistancesDisplayLine(event.distance ?? "");

  return (
    <article className="group relative h-full glass rounded-2xl overflow-hidden hover:border-neon/40 hover:-translate-y-1 hover:shadow-glass transition-all duration-300 flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-900">
        <EventCoverImage
          alt={event.title}
          titleHint={`Обкладинка події · пост у Telegram ${FARTLEK_PUBLIC_TELEGRAM_URL}`}
          variant="card"
          className="absolute inset-0 z-0 h-full w-full"
          event={event}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[42%] bg-gradient-to-t from-ink-950/95 to-transparent"
          aria-hidden
        />

        <div className="absolute top-3 left-3 z-[2] flex items-center gap-2">
          <StatusBadge status={event.status} />
        </div>

        <div className="absolute top-3 right-3 z-[2] flex items-center gap-1.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => toggle(event.id)}
            aria-pressed={fav}
            aria-label={fav ? "Видалити з обраного" : "Додати в обране"}
            className="h-9 w-9 grid place-items-center rounded-full bg-ink-950/70 backdrop-blur border border-white/10 hover:border-neon/40 transition-colors"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                fav
                  ? "fill-cyber-pink text-cyber-pink"
                  : "text-white/80"
              }`}
            />
          </motion.button>
          <ShareButton event={event} />
        </div>

        <div className="absolute bottom-3 left-3 z-[2] flex items-center gap-2">
          <Badge variant="muted" className="bg-ink-950/70 backdrop-blur">
            <CategoryIcon category={category} className="h-3 w-3" />
            {categoryLabel(category)}
          </Badge>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-neon transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-white/65">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-neon" />
            {formatEventDate(event.date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-neon" />
            {event.city}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-white/65">
            <Eye className="h-3.5 w-3.5 shrink-0 text-cyber-purple" />
            <span className="font-mono">{compactNumber(event.views)}</span>
            <span className="text-white/40">перегл.</span>
          </div>
          <div className="flex items-start gap-1.5 text-white/65 min-w-0">
            <Ruler className="h-3.5 w-3.5 shrink-0 text-cyber-blue mt-0.5" />
            <span
              className="font-mono min-w-0 break-words leading-snug"
              title={distanceLine || undefined}
            >
              {distanceLine || "—"}
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-neon to-cyber-blue grid place-items-center text-[10px] font-bold text-ink-950 shrink-0">
              {organizerLatinInitials(event.organizerName)}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-medium break-words leading-snug">
                {event.organizerName}
              </div>
              <div
                className="text-[10px] text-white/40"
                suppressHydrationWarning
              >
                {fromNow(event.date)}
              </div>
            </div>
          </div>

          <Link
            href={sportEventPagePath(event)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neon/15 border border-neon/30 text-neon text-xs font-semibold hover:bg-neon hover:text-ink-950 transition-colors shrink-0"
          >
            Детальніше
          </Link>
        </div>
      </div>
    </article>
  );
}
