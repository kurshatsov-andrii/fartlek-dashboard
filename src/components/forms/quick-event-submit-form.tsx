"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatUaQuickSubmitPhone,
  isValidUaQuickSubmitPhone,
} from "@/lib/ua-quick-submit-phone";

const textareaClass =
  "min-h-[100px] w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-neon/40 focus:border-neon/60 transition-all resize-y";

export function QuickEventSubmitForm() {
  const [phone, setPhone] = useState("+380");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );
  const [feedback, setFeedback] = useState<string>("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass rounded-2xl p-5"
    >
      <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-3">
        <Plus className="h-4 w-4 text-neon" />
        Швидке додавання
      </h3>
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const formEl = e.currentTarget;
          const fd = new FormData(formEl);
          const title = String(fd.get("title") ?? "").trim();
          const city = String(fd.get("city") ?? "").trim();
          const date = String(fd.get("date") ?? "").trim();
          const registrationLink = String(
            fd.get("registrationLink") ?? "",
          ).trim();
          const description = String(fd.get("description") ?? "").trim();

          const phoneFmt = phone.trim();

          if (
            !title ||
            !city ||
            !date ||
            !registrationLink ||
            !description ||
            !isValidUaQuickSubmitPhone(phoneFmt)
          ) {
            setStatus("err");
            setFeedback(
              !isValidUaQuickSubmitPhone(phoneFmt)
                ? "Заповніть телефон повністю: +380 XX XXX-XX-XX."
                : "Усі поля обов'язкові.",
            );
            return;
          }

          setStatus("loading");
          setFeedback("");

          try {
            const res = await fetch("/api/submit-quick-event", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                title,
                city,
                date,
                registrationLink,
                description,
                phone: phoneFmt,
              }),
            });

            const rawText = await res.text();
            let data: { ok?: boolean; error?: string } = {};
            if (rawText.trim()) {
              try {
                data = JSON.parse(rawText) as typeof data;
              } catch {
                /* проксі/шлюз інколи віддають не-JSON — обробляємо за HTTP-статусом */
              }
            }

            const serverSaysFail = data.ok === false;
            if (!res.ok || serverSaysFail) {
              setStatus("err");
              setFeedback(
                data.error ??
                  (res.ok && serverSaysFail
                    ? "Не вдалося надіслати."
                    : `Помилка сервера (${res.status}). Спробуйте ще раз.`),
              );
              return;
            }
          } catch {
            setStatus("err");
            setFeedback(
              "Не вдалося отримати відповідь сервера. Якщо повідомлення вже є в Telegram — все добре; інакше спробуйте ще раз.",
            );
            return;
          }

          setStatus("ok");
          setFeedback("Подія успішно відправлена");
          try {
            formEl.reset();
          } catch {
            /* після await e.currentTarget може бути недійсний — скидання не критичне */
          }
          setPhone("+380");
        }}
      >
        <Input name="title" placeholder="Назва події *" required />

        <Input name="city" placeholder="Місто *" required />

        <Input name="date" type="date" required aria-label="Дата події *" />

        <Input
          name="registrationLink"
          type="url"
          placeholder="Посилання на реєстрацію (https://…) *"
          required
        />

        <textarea
          name="description"
          className={cn(textareaClass)}
          placeholder="Опис події *"
          required
          minLength={1}
          maxLength={3500}
        />

        <div>
          <Input
            id="quick-event-phone"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="+380 XX XXX-XX-XX *"
            value={phone}
            required
            aria-invalid={
              phone.length > 5 && !isValidUaQuickSubmitPhone(phone.trim())
            }
            onChange={(ev) =>
              setPhone(formatUaQuickSubmitPhone(ev.target.value))
            }
            onBlur={() =>
              setPhone((p) => formatUaQuickSubmitPhone(p.trim() || "+380"))
            }
          />
          <p className="text-[10px] text-white/40 mt-1 px-1">
            Формат: +380 67 123-45-67 — усі 9 цифр після коду країни
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Надсилання…" : "Надіслати подію"}
        </Button>

        {(status === "ok" || status === "err") && feedback && (
          <p
            className={`text-[11px] text-center mt-2 ${
              status === "ok" ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {feedback}
          </p>
        )}

        <p className="text-[11px] text-white/40 text-center mt-1">
          100 ₴ за публікацію — оплата після підтвердження.
        </p>
      </form>
    </motion.div>
  );
}
