"use client";

import { motion } from "framer-motion";
import { CreditCard, ShieldCheck } from "lucide-react";
import { QuickEventSubmitForm } from "@/components/forms/quick-event-submit-form";
import { SectionHeader } from "@/components/sections/stats-section";
import { buttonVariants } from "@/components/ui/button";
import { FartlekTelegramChannelLink } from "@/components/ui/fartlek-telegram-channel-link";
import { cn } from "@/lib/utils";
import { WAYFORPAY_EVENT_PUBLISH_BUTTON_URL } from "@/lib/wayforpay-publish";
import { EVENT_PRICE_UAH, formatUAH } from "@/lib/utils";

export function QuickSubmitSection() {
  return (
    <section
      id="quick-add-event"
      className="relative scroll-mt-28 md:scroll-mt-32 py-16 md:py-20 border-t border-white/[0.06]"
    >
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Для організаторів"
          title="Додати подію"
          description={
            <>
              Оплатіть розміщення у нашому календарі та Telegram каналі{" "}
              <FartlekTelegramChannelLink /> через Wayforpay, потім надішліть
              дані старту — після перевірки подія з’явиться на сайті.
            </>
          }
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass-strong rounded-3xl border border-white/[0.09] p-6 md:p-8 flex flex-col gap-4 shadow-xl shadow-black/15"
          >
            <div className="flex items-center gap-2 text-neon font-display text-lg font-semibold">
              <CreditCard className="h-5 w-5 shrink-0" aria-hidden />
              Оплата за публікацію
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Вартість розміщення однієї події в телеграм каналі —{" "}
              <span className="text-white font-medium tabular-nums">
                {formatUAH(EVENT_PRICE_UAH)}
              </span>
              .
            </p>
            <a
              href={WAYFORPAY_EVENT_PUBLISH_BUTTON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full mt-1 no-underline",
              )}
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              Сплатити {formatUAH(EVENT_PRICE_UAH)} — Wayforpay
            </a>
            <p className="flex items-start gap-2 text-[11px] text-white/45 leading-relaxed">
              <ShieldCheck
                className="h-3.5 w-3.5 shrink-0 mt-0.5 text-white/55"
                aria-hidden
              />
              Після успішної оплати заповніть форму поруч і вкажете той самий номер телефону, на якому у вас знаходиться телеграм,
              щоб ми змогли узгодити платіж із заявкою.
            </p>
          </motion.div>

          <QuickEventSubmitForm />
        </div>
      </div>
    </section>
  );
}
