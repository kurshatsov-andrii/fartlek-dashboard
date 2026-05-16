"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Activity,
  CalendarPlus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FartlekTelegramChannelLink } from "@/components/ui/fartlek-telegram-channel-link";
import { CountdownTimer } from "@/components/widgets/countdown-timer";
import type { SportEvent } from "@/types";

interface HeroProps {
  nextEvent?: SportEvent;
  totalEvents: number;
  citiesCount: number;
}

export function Hero({ nextEvent, totalEvents, citiesCount }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="absolute inset-0 -z-10 bg-radial-fade" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[480px] w-[480px] rounded-full bg-neon/20 blur-3xl" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-neon opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
              </span>
              <span className="text-white/80">
                Живий календар · {totalEvents} подій · {citiesCount} міст
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.02em] leading-[1.05]"
            >
              Fartlek{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                  Події
                </span>
              </span>
              <br />
              <span className="neon-text">2026</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-5 max-w-xl mx-auto lg:mx-0 text-base md:text-lg text-white/70"
            >
              Найкращий дашборд спортивних подій України за даними дописів з
              Telegram каналу <FartlekTelegramChannelLink />: забіги, трейли,
              велоподії, плавання, триатлони та триатлон-спільні формати —
              знайдіть свою подію разом із біговою спільнотою.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3"
            >
              <Button
                size="lg"
                onClick={() => {
                  document
                    .getElementById("events")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Переглянути події
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  document
                    .getElementById("quick-add-event")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <CalendarPlus className="h-4 w-4" />
                Додати подію
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-wrap gap-x-8 gap-y-4 justify-center lg:justify-start text-sm"
            >
              <div className="flex items-center gap-2 text-white/70">
                <Activity className="h-4 w-4 text-neon" />
                Жива синхронізація з Telegram
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Sparkles className="h-4 w-4 text-neon" />
                Пошук, фільтри та обране
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5"
          >
            {nextEvent && <CountdownTimer event={nextEvent} />}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
