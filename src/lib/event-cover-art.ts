import { categoryColor } from "@/lib/analytics";
import type { EventCategory } from "@/types";

export type EventCoverArtInput = {
  seed: string;
  category: EventCategory;
  city: string;
};

export type EventCoverPalette = {
  /** CSS `background` for the base layer */
  background: string;
  accent: string;
  accentMuted: string;
  glow: string;
};

/** FNV-1a — стабільний колір для одного й того ж `seed`. */
export function hashEventSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(arr: readonly T[], seed: number, salt = 0): T {
  return arr[(seed + salt) % arr.length]!;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1]!, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
): { r: number; g: number; b: number } {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function rgba(hex: string, alpha: number): string {
  const c = hexToRgb(hex);
  if (!c) return `rgba(255,102,51,${alpha})`;
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

export function buildEventCoverPalette(input: EventCoverArtInput): EventCoverPalette {
  const seed = hashEventSeed(input.seed);
  const base = hexToRgb(categoryColor(input.category)) ?? {
    r: 255,
    g: 102,
    b: 51,
  };
  const shift = ((seed % 41) - 20) / 100;
  const accentRgb = mixRgb(base, { r: 255, g: 235, b: 20 }, 0.12 + shift * 0.35);
  const accent = rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b);
  const accent2 = rgbToHex(
    accentRgb.r * 0.55 + 61,
    accentRgb.g * 0.55 + 165,
    accentRgb.b * 0.55 + 255,
  );
  const angle = 118 + (seed % 48);
  const x1 = 12 + (seed % 28);
  const y1 = 8 + ((seed >> 4) % 22);

  return {
    accent,
    accentMuted: rgba(accent, 0.42),
    glow: rgba(accent, 0.28),
    background: [
      `linear-gradient(${angle}deg, #0a0a0b 0%, #121318 38%, ${rgba(accent, 0.38)} 100%)`,
      `radial-gradient(ellipse ${68 + (seed % 20)}% ${52 + (seed % 16)}% at ${x1}% ${y1}%, ${rgba(accent, 0.55)}, transparent 58%)`,
      `radial-gradient(circle at ${78 + (seed % 12)}% ${82 + (seed % 10)}%, ${rgba(accent2, 0.22)}, transparent 48%)`,
    ].join(", "),
  };
}

export type CitySilhouetteKey =
  | "kyiv"
  | "lviv"
  | "odesa"
  | "kharkiv"
  | "dnipro"
  | "zaporizhzhia"
  | "vinnytsia"
  | "chernivtsi"
  | "ivano-frankivsk"
  | "generic";

const CITY_ALIASES: ReadonlyArray<{ key: CitySilhouetteKey; patterns: readonly string[] }> =
  [
    { key: "kyiv", patterns: ["київ", "киев", "kyiv", "kiev"] },
    { key: "lviv", patterns: ["львів", "львов", "lviv"] },
    { key: "odesa", patterns: ["одес", "odesa", "odessa"] },
    { key: "kharkiv", patterns: ["харків", "харьков", "kharkiv"] },
    { key: "dnipro", patterns: ["дніпр", "днепр", "dnipro", "dnepr"] },
    {
      key: "zaporizhzhia",
      patterns: ["запоріж", "запорож", "zaporizh"],
    },
    { key: "vinnytsia", patterns: ["вінниц", "винниц", "vinnyts"] },
    { key: "chernivtsi", patterns: ["чернів", "черновц", "cherniv"] },
    {
      key: "ivano-frankivsk",
      patterns: ["івано-франк", "ивано-франк", "frankivsk"],
    },
  ];

export function resolveCitySilhouetteKey(city: string): CitySilhouetteKey {
  const norm = city
    .trim()
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/\s+/g, " ");
  if (!norm) return "generic";
  for (const { key, patterns } of CITY_ALIASES) {
    if (patterns.some((p) => norm.includes(p))) return key;
  }
  return "generic";
}

export type PatternKind =
  | "run"
  | "trail"
  | "wheel"
  | "wave"
  | "mixed"
  | "obstacle";

export function patternKindForCategory(category: EventCategory): PatternKind {
  switch (category) {
    case "cycling":
      return "wheel";
    case "swimming":
      return "wave";
    case "triathlon":
    case "duathlon":
    case "aquathlon":
      return "mixed";
    case "trail":
    case "ultra":
      return "trail";
    case "obstacle":
      return "obstacle";
    case "kids":
    case "marathon":
    default:
      return "run";
  }
}

export function patternOpacity(seed: number): number {
  return 0.14 + (seed % 9) * 0.012;
}

export function patternStrokeWidth(seed: number): number {
  return pick([1.2, 1.5, 1.8, 2], seed, 3);
}
