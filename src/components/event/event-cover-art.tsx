"use client";

import { CategoryIcon } from "@/components/event/category-icon";
import {
  buildEventCoverPalette,
  hashEventSeed,
  patternKindForCategory,
  patternOpacity,
  patternStrokeWidth,
  pick,
  resolveCitySilhouetteKey,
  type CitySilhouetteKey,
  type EventCoverArtInput,
  type PatternKind,
} from "@/lib/event-cover-art";
import { cn } from "@/lib/utils";

const CITY_PATHS: Record<CitySilhouetteKey, string> = {
  kyiv: "M0 220h48l18-95 22 95h36l14-62 26 62h44l20-88 18 88h52l12-42 28 42h38V220H0z",
  lviv: "M0 220h32l10-58 14 24 8-46 12 58h28l9-72 11 72h30l7-38 9 38h26l11-64 13 64h34l8-28 10 28h40V220H0z",
  odesa:
    "M0 220h36l22-52c8-18 28-18 36 0l22 52h40l16-74 14 74h44l18-48 12 48h32V220H0z",
  kharkiv:
    "M0 220h40l16-68 20 68h34l12-52 18 52h38l14-78 16 78h42l10-36 14 36h36V220H0z",
  dnipro:
    "M0 220h44l20-82 24 82h36l11-44 17 44h32l15-66 19 66h38l13-38 15 38h34V220H0z",
  zaporizhzhia:
    "M0 220h38l18-60 22 60h30l10-88 14 88h36l12-48 16 48h34l20-72 18 72h40V220H0z",
  vinnytsia:
    "M0 220h34l12-54 16 54h28l9-70 13 70h32l11-40 15 40h30l14-58 16 58h36V220H0z",
  chernivtsi:
    "M0 220h30l8-62 12 28 10-48 14 62h26l9-74 11 74h28l7-36 9 36h24l12-56 14 56h32V220H0z",
  "ivano-frankivsk":
    "M0 220h32l10-66 14 66h26l8-52 12 52h28l11-78 13 78h30l9-34 11 34h28V220H0z",
  generic:
    "M0 220h28l8-42 10 42h24l7-58 11 58h26l9-34 11 34h22l10-48 12 48h28l8-28 10 28h30l12-52 14 52h32l10-38 12 38h28V220H0z",
};

function RunningPattern({
  kind,
  seed,
  accent,
  className,
}: {
  kind: PatternKind;
  seed: number;
  accent: string;
  className?: string;
}) {
  const opacity = patternOpacity(seed);
  const sw = patternStrokeWidth(seed);
  const phase = seed % 360;

  if (kind === "wheel") {
    return (
      <svg
        className={cn("absolute inset-0 h-full w-full", className)}
        viewBox="0 0 400 240"
        preserveAspectRatio="xMaxYMin slice"
        aria-hidden
      >
        <g
          fill="none"
          stroke={accent}
          strokeWidth={sw}
          opacity={opacity}
          transform={`translate(280 40) rotate(${phase % 30})`}
        >
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx="0" cy="0" r={28 + i * 22} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line
              key={i}
              x1="0"
              y1="0"
              x2="0"
              y2="-90"
              transform={`rotate(${i * 45})`}
            />
          ))}
        </g>
      </svg>
    );
  }

  if (kind === "wave") {
    return (
      <svg
        className={cn("absolute inset-0 h-full w-full", className)}
        viewBox="0 0 400 240"
        preserveAspectRatio="xMaxYMid slice"
        aria-hidden
      >
        <g fill="none" stroke={accent} strokeWidth={sw + 0.3} opacity={opacity}>
          {[0, 1, 2, 3].map((row) => (
            <path
              key={row}
              d={`M220 ${60 + row * 28} Q260 ${40 + row * 28} 300 ${60 + row * 28} T380 ${60 + row * 28}`}
            />
          ))}
        </g>
      </svg>
    );
  }

  const chevronCount = kind === "trail" ? 7 : kind === "obstacle" ? 5 : 6;
  const dash = kind === "mixed" ? "6 10" : kind === "trail" ? "2 14" : "4 12";

  return (
    <svg
      className={cn("absolute inset-0 h-full w-full", className)}
      viewBox="0 0 400 260"
      preserveAspectRatio="xMaxYMin slice"
      aria-hidden
    >
      <g
        fill="none"
        stroke={accent}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={dash}
        opacity={opacity}
        transform={`translate(${200 + (seed % 24)} ${20 + (seed % 16)}) rotate(${-18 + (seed % 12)})`}
      >
        {Array.from({ length: chevronCount }, (_, i) => {
          const y = i * 26;
          const w = 120 + (i % 3) * 18;
          return (
            <path
              key={i}
              d={`M0 ${y} L${w * 0.45} ${y + 14} L0 ${y + 28} M${w * 0.55} ${y} L${w} ${y + 14} L${w * 0.55} ${y + 28}`}
            />
          );
        })}
        {kind === "obstacle"
          ? Array.from({ length: 4 }, (_, i) => (
              <rect
                key={`b${i}`}
                x={40 + i * 34}
                y={150 + (i % 2) * 12}
                width={18}
                height={18}
                rx="2"
                fill={accent}
                fillOpacity={opacity * 0.35}
                stroke="none"
              />
            ))
          : null}
      </g>
    </svg>
  );
}

export type EventCoverArtProps = EventCoverArtInput & {
  className?: string;
  /** Компактний режим для мініатюр адмінки */
  compact?: boolean;
};

export function EventCoverArt({
  seed,
  category,
  city,
  className,
  compact = false,
}: EventCoverArtProps) {
  const palette = buildEventCoverPalette({ seed, category, city });
  const hash = hashEventSeed(seed);
  const cityKey = resolveCitySilhouetteKey(city);
  const patternKind = patternKindForCategory(category);
  const gradientId = `city-fade-${hash}`;

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: palette.background }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          background: `radial-gradient(circle at ${pick([22, 32, 42], hash, 1)}% ${pick([18, 28, 38], hash, 2)}%, ${palette.glow}, transparent 55%)`,
        }}
      />

      <RunningPattern
        kind={patternKind}
        seed={hash}
        accent={palette.accent}
        className="pointer-events-none"
      />

      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.08]" />

      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center",
          compact ? "pb-2" : "pb-[12%]",
        )}
      >
        <div
          className={cn(
            "grid place-items-center rounded-full border border-white/10 bg-ink-950/35 backdrop-blur-sm",
            compact
              ? "h-10 w-10 scale-[0.55]"
              : "h-[clamp(3.5rem,18vw,5.5rem)] w-[clamp(3.5rem,18vw,5.5rem)]",
          )}
          style={{
            boxShadow: `0 0 48px ${palette.accentMuted}, inset 0 0 24px rgba(255,255,255,0.04)`,
          }}
        >
          <CategoryIcon
            category={category}
            className={cn(
              "text-white/90 drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]",
              compact
                ? "h-5 w-5"
                : "h-[clamp(1.75rem,8vw,2.75rem)] w-[clamp(1.75rem,8vw,2.75rem)]",
            )}
          />
        </div>
      </div>

      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] w-full text-white"
        viewBox="0 0 400 220"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="35%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.28" />
          </linearGradient>
        </defs>
        <path
          d={CITY_PATHS[cityKey]}
          fill={`url(#${gradientId})`}
          transform="translate(0, 8) scale(1.02)"
        />
      </svg>

      {!compact && city.trim() ? (
        <p
          className="pointer-events-none absolute bottom-3 left-0 right-0 z-[1] text-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/45"
          aria-hidden
        >
          {city.trim()}
        </p>
      ) : null}
    </div>
  );
}
