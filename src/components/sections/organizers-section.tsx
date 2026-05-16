"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, MapPin, Star } from "lucide-react";
import { SectionHeader } from "./stats-section";
import { Badge } from "@/components/ui/badge";
import {
  FartlekTelegramChannelLink,
  fragmentsWithFartlekTelegramHandle,
} from "@/components/ui/fartlek-telegram-channel-link";
import { categoryLabel } from "@/lib/analytics";
import { formatEventDate } from "@/lib/date";
import { sportEventPagePath } from "@/lib/event-detail";
import { organizerLatinInitials } from "@/lib/organizer-initials";
import { cn } from "@/lib/utils";
import type { Organizer, SportEvent } from "@/types";

interface OrganizersSectionProps {
  organizers: Organizer[];
  events: SportEvent[];
}

function sortEventsForOrganizer(events: SportEvent[]): SportEvent[] {
  const up = events
    .filter((e) => e.state === "upcoming")
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  const fin = events
    .filter((e) => e.state === "finished")
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  return [...up, ...fin];
}

export function OrganizersSection({
  organizers,
  events,
}: OrganizersSectionProps) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  const eventsByOrganizer = useMemo(() => {
    const m = new Map<string, SportEvent[]>();
    for (const e of events) {
      const arr = m.get(e.organizerId);
      if (arr) arr.push(e);
      else m.set(e.organizerId, [e]);
    }
    return m;
  }, [events]);

  const toggleOrganizer = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <section id="organizers" className="relative py-16 md:py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Спільнота"
          title="Топ організатори"
          description={
            <>
              Імена та міста з тексту дописів Telegram (
              <FartlekTelegramChannelLink />), згруповані за описом організатора
              події.
            </>
          }
        />

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {organizers.map((o, idx) => {
            const orgEvents = sortEventsForOrganizer(
              eventsByOrganizer.get(o.id) ?? [],
            );
            const isOpen = openIds.includes(o.id);
            const panelId = `organizer-events-${o.id}`;

            return (
              <motion.article
                key={o.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group glass rounded-2xl p-5 text-center hover:border-neon/40 hover:-translate-y-1 transition-all flex flex-col items-center"
              >
                <div className="relative inline-block">
                  <span
                    role="img"
                    aria-label={o.name}
                    className="h-16 w-16 rounded-full bg-gradient-to-br from-neon to-cyber-blue grid place-items-center text-lg font-bold font-mono text-ink-950 ring-2 ring-neon/30 group-hover:ring-neon transition-all"
                  >
                    {organizerLatinInitials(o.name)}
                  </span>
                  <CheckCircle2 className="absolute -bottom-1 -right-1 h-5 w-5 text-neon bg-ink-950 rounded-full" />
                </div>
                <h3 className="mt-3 font-display text-base font-semibold break-words leading-snug">
                  {o.name}
                </h3>
                <p className="mt-1 text-xs text-white/55 line-clamp-2">
                  {fragmentsWithFartlekTelegramHandle(o.bio)}
                </p>
                <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-white/65">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-neon" />
                    {o.city}
                  </span>
                  {o.rating > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 text-cyber-yellow fill-cyber-yellow" />
                      {o.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex w-full flex-col items-center gap-0">
                  <button
                    type="button"
                    id={`organizer-toggle-${o.id}`}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleOrganizer(o.id)}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors",
                      "hover:border-neon/35 hover:text-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/50",
                    )}
                  >
                    {o.eventsCount} подій
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={`organizer-toggle-${o.id}`}
                    className={cn(
                      "w-full overflow-hidden transition-[max-height] duration-300 ease-out",
                      isOpen ? "max-h-[min(55vh,360px)]" : "max-h-0",
                    )}
                  >
                    <ul className="mt-3 max-h-[min(55vh,360px)] space-y-2 overflow-y-auto pr-0.5 text-left">
                      {orgEvents.length === 0 ? (
                        <li className="text-center text-[11px] text-white/45 py-2">
                          Немає подій у списку.
                        </li>
                      ) : (
                        orgEvents.map((e) => (
                          <li
                            key={e.id}
                            className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-semibold leading-snug text-white/90 min-w-0">
                                {e.title}
                              </h4>
                              <Badge
                                variant="muted"
                                className="text-[9px] shrink-0"
                              >
                                {categoryLabel(e.category)}
                              </Badge>
                            </div>
                            <p className="mt-1 text-[10px] text-white/50">
                              {formatEventDate(e.date)}
                              {e.state === "finished" ? " · завершено" : ""}
                            </p>
                            <Link
                              href={sportEventPagePath(e)}
                              className="mt-1.5 inline-flex text-[10px] font-semibold text-neon hover:text-neon-400 hover:underline underline-offset-2"
                            >
                              Детальніше
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
