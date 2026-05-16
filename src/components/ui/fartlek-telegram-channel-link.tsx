import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  FARTLEK_PUBLIC_TELEGRAM_HANDLE,
  FARTLEK_PUBLIC_TELEGRAM_URL,
} from "@/lib/fartlek-telegram-public";

type FartlekTelegramChannelLinkProps = {
  className?: string;
  children?: ReactNode;
};

/** Клікабельний @fartlekua з посиланням на канал. */
export function FartlekTelegramChannelLink({
  className,
  children,
}: FartlekTelegramChannelLinkProps) {
  return (
    <a
      href={FARTLEK_PUBLIC_TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "font-medium text-neon hover:text-neon-400 underline-offset-4 hover:underline",
        className,
      )}
    >
      {children ?? FARTLEK_PUBLIC_TELEGRAM_HANDLE}
    </a>
  );
}

/** Замінює всі входження `@fartlekua` на посилання на канал (для довільних рядків). */
export function fragmentsWithFartlekTelegramHandle(text: string): ReactNode {
  const token = FARTLEK_PUBLIC_TELEGRAM_HANDLE;
  if (!text.includes(token)) return text;
  const parts = text.split(token);
  return parts.map((part, idx, arr) => (
    <Fragment key={`tg-seg-${idx}`}>
      {part}
      {idx < arr.length - 1 ?
        <FartlekTelegramChannelLink key={`tg-l-${idx}`} />
      : null}
    </Fragment>
  ));
}
