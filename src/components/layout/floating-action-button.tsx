"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function FloatingActionButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 30 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="fixed z-40 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 lg:bottom-6 lg:right-6 h-14 w-14 rounded-full bg-neon text-ink-950 grid place-items-center shadow-neon hover:shadow-[0_0_36px_rgba(255,102,51,0.7)] transition-shadow touch-manipulation"
          aria-label="Нагору"
        >
          <ArrowUp className="h-6 w-6" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
