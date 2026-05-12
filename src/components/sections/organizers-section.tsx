"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Star } from "lucide-react";
import { SectionHeader } from "./stats-section";
import { Badge } from "@/components/ui/badge";
import type { Organizer } from "@/types";

interface OrganizersSectionProps {
  organizers: Organizer[];
}

export function OrganizersSection({ organizers }: OrganizersSectionProps) {
  return (
    <section id="organizers" className="relative py-16 md:py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Спільнота"
          title="Топ організатори"
          description="Імена та міста з тексту дописів Telegram (@fartlekua), згруповані за описом організатора події."
        />

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {organizers.map((o, idx) => (
            <motion.article
              key={o.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="group glass rounded-2xl p-5 text-center hover:border-neon/40 hover:-translate-y-1 transition-all"
            >
              <div className="relative inline-block">
                <img
                  src={o.avatar}
                  alt={o.name}
                  loading="lazy"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-neon/30 group-hover:ring-neon transition-all"
                />
                <CheckCircle2 className="absolute -bottom-1 -right-1 h-5 w-5 text-neon bg-ink-950 rounded-full" />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">
                {o.name}
              </h3>
              <p className="mt-1 text-xs text-white/55 line-clamp-2 light:text-black/55">
                {o.bio}
              </p>
              <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-white/65 light:text-black/65">
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
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Badge variant="muted">{o.eventsCount} подій</Badge>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
