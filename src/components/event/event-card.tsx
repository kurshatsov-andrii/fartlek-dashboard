"use client";

import { motion } from "framer-motion";
import { CalendarDays, Eye, Heart, MapPin, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/components/providers/favorites-provider";
import { categoryLabel } from "@/lib/analytics";
import { formatEventDate, fromNow } from "@/lib/date";
import { compactNumber } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { CategoryIcon } from "./category-icon";
import type { SportEvent } from "@/types";
import { ShareButton } from "@/components/widgets/share-button";
import { EventCoverImage } from "./event-cover-image";

interface EventCardProps {
  event: SportEvent;
}

export function EventCard({ event }: EventCardProps) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(event.id);

  return (
    <article className="group relative h-full glass rounded-2xl overflow-hidden hover:border-neon/40 hover:-translate-y-1 hover:shadow-glass transition-all duration-300 flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden">
        <EventCoverImage
          originalSrc={event.image}
          alt={event.title}
          titleHint="Фото прев'ю з поста в Telegram @fartlekua"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <StatusBadge status={event.status} />
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
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

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Badge variant="muted" className="bg-ink-950/70 backdrop-blur">
            <CategoryIcon category={event.category} className="h-3 w-3" />
            {categoryLabel(event.category)}
          </Badge>
          {event.distance && (
            <Badge variant="neon" className="bg-neon/20 backdrop-blur">
              {event.distance}
            </Badge>
          )}
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

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-white/65">
            <ThumbsUp className="h-3.5 w-3.5 text-cyber-blue" />
            <span className="font-mono">
              {compactNumber(event.likes)}
            </span>
            <span className="text-white/40">лайк.</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/65">
            <Eye className="h-3.5 w-3.5 text-cyber-purple" />
            <span className="font-mono">{compactNumber(event.views)}</span>
            <span className="text-white/40">перегл.</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-neon to-cyber-blue grid place-items-center text-[10px] font-bold text-ink-950 shrink-0">
              {event.organizerName
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">
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

          {event.state === "upcoming" ? (
            <a
              href={event.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neon/15 border border-neon/30 text-neon text-xs font-semibold hover:bg-neon hover:text-ink-950 transition-colors shrink-0"
            >
              Реєстрація
            </a>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 shrink-0">
              Результати
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
