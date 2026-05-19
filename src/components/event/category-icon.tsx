"use client";

import {
  Baby,
  Bike,
  Droplets,
  Flame,
  Footprints,
  Mountain,
  Waves,
} from "lucide-react";
import type { EventCategory } from "@/types";
import { cn } from "@/lib/utils";

type IconComp = React.ComponentType<{ className?: string }>;

const SINGLE_ICON: Record<
  Exclude<EventCategory, "triathlon" | "duathlon" | "aquathlon">,
  IconComp
> = {
  marathon: Footprints,
  trail: Mountain,
  ultra: Flame,
  cycling: Bike,
  swimming: Waves,
  kids: Baby,
  obstacle: Droplets,
};

const MULTI_LABEL: Record<"triathlon" | "duathlon" | "aquathlon", string> = {
  duathlon: "Біг, вело, біг",
  aquathlon: "Плавання, біг",
  triathlon: "Плавання, вело, біг",
};

/** Мультидисципліни: помірний розмір + більше повітря між піктограмами. */
const GLYPH_TRI = "h-[38%] w-[38%] max-h-full max-w-full";
const GLYPH_DUO = "h-[38%] w-[38%] max-h-full max-w-full";

function IconFrame({
  className,
  label,
  children,
}: {
  className: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      role="img"
      aria-label={label}
      title={label}
    >
      {children}
    </span>
  );
}

/** Верх: дві дисципліни по кутах, низ по центру — трикутник. */
function TriangleLayout({
  topLeft: TopLeft,
  topRight: TopRight,
  bottom: Bottom,
  className,
  label,
}: {
  topLeft: IconComp;
  topRight: IconComp;
  bottom: IconComp;
  className: string;
  label: string;
}) {
  return (
    <IconFrame className={className} label={label}>
      <TopLeft
        className={cn("absolute left-[4%] top-[6%]", GLYPH_TRI)}
        aria-hidden
      />
      <TopRight
        className={cn("absolute right-[4%] top-[6%]", GLYPH_TRI)}
        aria-hidden
      />
      <Bottom
        className={cn(
          "absolute left-1/2 bottom-[4%] -translate-x-1/2",
          GLYPH_TRI,
        )}
        aria-hidden
      />
    </IconFrame>
  );
}

/** Дві дисципліни по вертикалі — зверху плавання, знизу біг, по центру. */
function VerticalPairLayout({
  top: Top,
  bottom: Bottom,
  className,
  label,
}: {
  top: IconComp;
  bottom: IconComp;
  className: string;
  label: string;
}) {
  return (
    <IconFrame className={className} label={label}>
      <Top
        className={cn(
          "absolute left-1/2 top-[5%] -translate-x-1/2",
          GLYPH_DUO,
        )}
        aria-hidden
      />
      <Bottom
        className={cn(
          "absolute left-1/2 bottom-[5%] -translate-x-1/2",
          GLYPH_DUO,
        )}
        aria-hidden
      />
    </IconFrame>
  );
}

function MultiCategoryIcon({
  category,
  className,
}: {
  category: "triathlon" | "duathlon" | "aquathlon";
  className: string;
}) {
  const label = MULTI_LABEL[category];

  if (category === "triathlon") {
    return (
      <TriangleLayout
        topLeft={Waves}
        topRight={Footprints}
        bottom={Bike}
        className={className}
        label={label}
      />
    );
  }

  if (category === "duathlon") {
    return (
      <TriangleLayout
        topLeft={Footprints}
        topRight={Footprints}
        bottom={Bike}
        className={className}
        label={label}
      />
    );
  }

  return (
    <VerticalPairLayout
      top={Waves}
      bottom={Footprints}
      className={className}
      label={label}
    />
  );
}

export function CategoryIcon({
  category,
  className = "h-4 w-4",
}: {
  category: EventCategory;
  className?: string;
}) {
  if (
    category === "triathlon" ||
    category === "duathlon" ||
    category === "aquathlon"
  ) {
    return <MultiCategoryIcon category={category} className={className} />;
  }

  const Icon =
    SINGLE_ICON[category as keyof typeof SINGLE_ICON] ?? Footprints;
  return <Icon className={className} aria-hidden />;
}
