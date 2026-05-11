"use client";

import { useCallback, useMemo, useState } from "react";
import { EVENT_COVER_FALLBACK, eventCoverImageUrl } from "@/lib/event-image";
import { cn } from "@/lib/utils";

type EventCoverImageProps = {
  originalSrc: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

/**
 * Telegraph CDN serves covers as `application/octet-stream`; some browsers
 * refuse to paint them. We load via same-origin `/api/event-image` first,
 * then direct URL, then a static fallback.
 */
export function EventCoverImage({
  originalSrc,
  alt,
  className,
  loading = "lazy",
}: EventCoverImageProps) {
  const candidates = useMemo(() => {
    const proxied = eventCoverImageUrl(originalSrc);
    if (proxied !== originalSrc) {
      return [proxied, originalSrc, EVENT_COVER_FALLBACK];
    }
    return [originalSrc, EVENT_COVER_FALLBACK];
  }, [originalSrc]);

  const [index, setIndex] = useState(0);
  const src = candidates[Math.min(index, candidates.length - 1)];

  const onError = useCallback(() => {
    setIndex((i) => (i < candidates.length - 1 ? i + 1 : i));
  }, [candidates.length]);

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={onError}
      className={cn(className)}
    />
  );
}
