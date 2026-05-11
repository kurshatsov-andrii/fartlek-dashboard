"use client";

import { motion } from "framer-motion";
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  type LucideIcon,
} from "lucide-react";

interface WeatherWidgetProps {
  city: string;
  temp: number;
  condition: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Сонячно: Sun,
  Хмарно: Cloud,
  "Невеликий дощ": CloudRain,
  "Мінлива хмарність": CloudSun,
};

export function WeatherWidget({ city, temp, condition }: WeatherWidgetProps) {
  const Icon = ICON_MAP[condition] ?? CloudSun;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-4 flex items-center gap-3"
    >
      <div className="h-12 w-12 rounded-xl grid place-items-center bg-gradient-to-br from-cyber-blue/40 to-cyber-purple/30 text-cyber-blue">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-widest text-white/45 light:text-black/45">
          Прогноз · {city}
        </div>
        <div className="font-display text-2xl font-bold leading-tight">
          {temp}°<span className="text-white/40 text-sm font-normal light:text-black/40"> · {condition}</span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-white/30 light:text-black/30">
        Демо
      </span>
    </motion.div>
  );
}
