import { cn } from "@/lib/utils";

export type EventCoverImageVariant = "card" | "hero" | "thumb";

export type EventCoverImageProps = {
  alt: string;
  titleHint?: string;
  className?: string;
  variant?: EventCoverImageVariant;
};

export function EventCoverImage({
  alt,
  titleHint,
  className,
  variant = "card",
}: EventCoverImageProps) {
  const title = alt.trim() || "Подія";

  return (
    <div
      role="img"
      aria-label={titleHint ?? title}
      title={titleHint ?? title}
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-ink-900 via-ink-850 to-ink-900",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(circle at 28% 18%, rgba(255,102,51,0.22), transparent 52%), radial-gradient(circle at 78% 82%, rgba(255,235,20,0.08), transparent 45%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.12]" />

      <p
        className={cn(
          "relative z-[1] px-3 text-center text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]",
          variant === "hero" &&
            "font-display text-xl font-bold leading-snug line-clamp-5 max-w-[min(94%,680px)] px-6 sm:text-2xl md:text-3xl",
          variant === "card" &&
            "text-sm font-semibold leading-snug line-clamp-4 max-w-[96%] md:text-base",
          variant === "thumb" &&
            "text-[10px] font-semibold leading-tight line-clamp-4 max-w-[98%] md:text-[11px]",
        )}
      >
        {title}
      </p>
    </div>
  );
}
