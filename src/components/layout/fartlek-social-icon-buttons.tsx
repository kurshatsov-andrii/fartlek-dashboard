"use client";

import {
  ClipboardList,
  Facebook,
  Globe,
  Instagram,
  Send,
} from "lucide-react";
import {
  FARTLEK_FACEBOOK_GROUP_URL,
  FARTLEK_INSTAGRAM_URL,
  FARTLEK_MAIN_WEBSITE_URL,
  FARTLEK_PUBLIC_TELEGRAM_URL,
  FARTLEK_REGISTRATION_APP_URL,
} from "@/lib/fartlek-social-urls";

const btn =
  "h-9 w-9 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:border-neon/40 hover:bg-neon/10 transition-colors shrink-0";

type Props = {
  className?: string;
};

/** Кнопки-іконки публічних каналів Fartlek (футер, сторінка «Контакти», тощо). */
export function FartlekSocialIconButtons({ className }: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <a
        href={FARTLEK_PUBLIC_TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Telegram — канал @fartlekua"
      >
        <Send className="h-4 w-4" />
      </a>
      <a
        href={FARTLEK_INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Instagram @fartlekua"
      >
        <Instagram className="h-4 w-4" />
      </a>
      <a
        href={FARTLEK_FACEBOOK_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Facebook — група Fartlek UA"
      >
        <Facebook className="h-4 w-4" />
      </a>
      <a
        href={FARTLEK_MAIN_WEBSITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Сайт fartlek.com.ua"
      >
        <Globe className="h-4 w-4" />
      </a>
      <a
        href={FARTLEK_REGISTRATION_APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Платформа реєстрації на спортивні події"
      >
        <ClipboardList className="h-4 w-4" />
      </a>
    </div>
  );
}
