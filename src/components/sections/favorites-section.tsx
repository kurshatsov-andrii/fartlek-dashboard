"use client";

import { Heart, HeartCrack } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeader } from "./stats-section";
import { EventCard } from "@/components/event/event-card";
import { useFavorites } from "@/components/providers/favorites-provider";
import type { SportEvent } from "@/types";

interface FavoritesSectionProps {
  events: SportEvent[];
}

export function FavoritesSection({ events }: FavoritesSectionProps) {
  const { favorites } = useFavorites();
  const list = events.filter((e) => favorites.includes(e.id));

  return (
    <section id="favorites" className="relative py-16 md:py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Ваш список"
          title="Збережені події"
          description="Швидкий доступ до подій, які ви додали в обране. Зберігаються локально у вашому браузері."
        />

        <div className="mt-8">
          {list.length === 0 ? (
            <div className="glass rounded-2xl p-10 md:p-14 text-center">
              <div className="mx-auto h-16 w-16 rounded-full grid place-items-center bg-white/5 border border-white/10 light:bg-black/5 light:border-black/10">
                <HeartCrack className="h-7 w-7 text-white/50 light:text-black/50" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">
                Поки немає обраних
              </h3>
              <p className="mt-2 text-sm text-white/55 light:text-black/55">
                Натисніть на іконку{" "}
                <Heart className="inline h-3.5 w-3.5 text-cyber-pink" /> на
                будь-якій картці події, щоб додати її сюди.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {list.map((e, idx) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                >
                  <EventCard event={e} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
