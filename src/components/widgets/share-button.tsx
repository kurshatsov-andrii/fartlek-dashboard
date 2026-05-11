"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Facebook, Link2, Send, Share2, Twitter } from "lucide-react";
import type { SportEvent } from "@/types";

interface ShareButtonProps {
  event: SportEvent;
}

export function ShareButton({ event }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}#event-${event.id}`
      : `https://fartlek.events/event/${event.slug}`;
  const text = `${event.title} — ${event.city}, ${new Date(
    event.date,
  ).toDateString()}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const handleNative = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url: shareUrl });
        setOpen(false);
      } catch {
        // ignore
      }
    } else {
      setOpen((v) => !v);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleNative}
        aria-label="Поділитися подією"
        className="h-9 w-9 grid place-items-center rounded-full bg-ink-950/70 backdrop-blur border border-white/10 hover:border-neon/40 transition-colors"
      >
        <Share2 className="h-4 w-4 text-white/80" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-11 z-30 glass-strong rounded-xl p-2 min-w-[180px] flex flex-col"
          >
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                shareUrl,
              )}&text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-white/5"
            >
              <Send className="h-3.5 w-3.5 text-sky-400" /> Telegram
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                text,
              )}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-white/5"
            >
              <Twitter className="h-3.5 w-3.5 text-sky-400" /> Twitter
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                shareUrl,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-white/5"
            >
              <Facebook className="h-3.5 w-3.5 text-blue-500" /> Facebook
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-white/5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-neon" />
                  Скопійовано!
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" /> Копіювати посилання
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
