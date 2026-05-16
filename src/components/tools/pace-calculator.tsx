"use client";

import { useMemo, useState } from "react";
import { Gauge, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  computeFinishSeconds,
  computePaceSecondsPerKm,
  formatHms,
  formatMmSs,
  parseClockToSeconds,
  parseDistanceKm,
} from "@/lib/pace-calculator";

const KM_PRESETS = [
  { label: "5 км", value: "5" },
  { label: "10 км", value: "10" },
  { label: "21,1 км", value: "21.0975" },
  { label: "42,195 км", value: "42.195" },
] as const;

type CalcMode = "pace" | "time";

type PaceCalculatorWidgetProps = {
  /** Без заголовка/опису — для сторінки, де заголовок у layout. */
  variant?: "standalone" | "embedded";
};

export function PaceCalculatorWidget({
  variant = "standalone",
}: PaceCalculatorWidgetProps) {
  const [mode, setMode] = useState<CalcMode>("pace");
  const [distanceStr, setDistanceStr] = useState("21.0975");

  /** Фінішний час (для режиму «знайти темп») */
  const [finishTimeStr, setFinishTimeStr] = useState("1:54:59");
  /** Темп хв:сек на км (для режиму «знайти час») */
  const [paceInputStr, setPaceInputStr] = useState("5:27");

  const distanceKm = useMemo(() => parseDistanceKm(distanceStr), [distanceStr]);

  const paceResultSecPerKm =
    mode === "pace"
      ? (() => {
          const secs = parseClockToSeconds(finishTimeStr);
          if (secs === null || distanceKm === null) return null;
          return computePaceSecondsPerKm(distanceKm, secs);
        })()
      : null;

  const finishResultSecs =
    mode === "time"
      ? (() => {
          const paceSecs = parseClockToSeconds(paceInputStr);
          if (paceSecs === null || distanceKm === null) return null;
          return computeFinishSeconds(distanceKm, paceSecs);
        })()
      : null;

  const paceModeErrorMessage = useMemo(() => {
    if (mode !== "pace") return null;
    if (!distanceStr.trim() || !finishTimeStr.trim()) return null;
    if (paceResultSecPerKm !== null) return null;
    if (parseDistanceKm(distanceStr) === null) {
      return "Перевірте дистанцію км (до 500).";
    }
    if (parseClockToSeconds(finishTimeStr) === null) {
      return "Некоректний час. Зразки: «1:45:30», «61:58».";
    }
    return "Час пробігу має бути більший за нуль.";
  }, [mode, distanceStr, finishTimeStr, paceResultSecPerKm]);

  const timeModeErrorMessage = useMemo(() => {
    if (mode !== "time") return null;
    if (!distanceStr.trim() || !paceInputStr.trim()) return null;
    if (finishResultSecs !== null) return null;
    if (parseDistanceKm(distanceStr) === null) {
      return "Перевірте дистанцію км (до 500).";
    }
    if (parseClockToSeconds(paceInputStr) === null) {
      return "Некоректний темп. Зразок хв за км: «5:30» або «4:52».";
    }
    return "Темп має бути більшим за нуль.";
  }, [mode, distanceStr, paceInputStr, finishResultSecs]);

  return (
    <div className="glass rounded-2xl border border-white/10 p-5 md:p-8 space-y-6">
      {variant === "standalone" ? (
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/15 text-neon border border-neon/30">
            <Gauge className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold text-white">
              Калькулятор темпу
            </h2>
            <p className="text-xs text-white/55 mt-1 leading-relaxed">
              Розрахунок темпу хв за км із фінального часу або прогнозованого часу з
              заданого темпу (шосейний пробіг без урахування набору висоти й
              погоди).
            </p>
          </div>
        </div>
      ) : null}

      <div
        className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/25 p-1.5"
        role="tablist"
        aria-label="Режим розрахунку"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "pace"}
          onClick={() => setMode("pace")}
          className={cn(
            "flex-1 min-w-[132px] rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors touch-manipulation",
            mode === "pace"
              ? "bg-neon/20 text-neon border border-neon/35 shadow-sm"
              : "text-white/65 hover:bg-white/[0.05] hover:text-white border border-transparent",
          )}
        >
          Знайти темп
          <span className="block text-[10px] font-normal opacity-85 mt-0.5">
            дистанція + час пробігу
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "time"}
          onClick={() => setMode("time")}
          className={cn(
            "flex-1 min-w-[132px] rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors touch-manipulation",
            mode === "time"
              ? "bg-neon/20 text-neon border border-neon/35 shadow-sm"
              : "text-white/65 hover:bg-white/[0.05] hover:text-white border border-transparent",
          )}
        >
          Знайти час
          <span className="block text-[10px] font-normal opacity-85 mt-0.5">
            дистанція + темп за км
          </span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="pace-dist"
            className="text-[11px] font-medium uppercase tracking-wide text-white/45"
          >
            Дистанція, км
          </label>
          <Input
            id="pace-dist"
            type="text"
            inputMode="decimal"
            value={distanceStr}
            onChange={(e) => setDistanceStr(e.target.value)}
            placeholder="Наприклад 21.1 або 42.195"
            className="rounded-2xl"
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-2">
            {KM_PRESETS.map((p) => (
              <Button
                key={p.value}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full h-8 px-3 text-[11px] border-white/12 bg-white/[0.03] hover:bg-neon/10 hover:border-neon/30 hover:text-neon text-white/80"
                onClick={() => setDistanceStr(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {mode === "pace" ? (
          <div className="space-y-2">
            <label
              htmlFor="pace-finish"
              className="text-[11px] font-medium uppercase tracking-wide text-white/45"
            >
              Цільовий або фактичний час пробігу
            </label>
            <Input
              id="pace-finish"
              type="text"
              value={finishTimeStr}
              onChange={(e) => setFinishTimeStr(e.target.value)}
              placeholder="1:54:59 або 124:52"
              className="rounded-2xl font-mono text-[15px] tracking-wide"
              autoComplete="off"
            />
            <p className="text-[11px] text-white/40">
              Години:хвилини:секунди, або лише хвилини й секунди (напр.{" "}
              <span className="font-mono">61:52</span>).
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label
              htmlFor="pace-per-km"
              className="text-[11px] font-medium uppercase tracking-wide text-white/45"
            >
              Темп (хв:сек на 1 км)
            </label>
            <Input
              id="pace-per-km"
              type="text"
              value={paceInputStr}
              onChange={(e) => setPaceInputStr(e.target.value)}
              placeholder="5:27"
              className="rounded-2xl font-mono text-[15px] tracking-wide"
              autoComplete="off"
            />
          </div>
        )}
      </div>

      {mode === "pace" ?
        <>
          {paceResultSecPerKm !== null ?
            <div className="rounded-2xl border border-neon/25 bg-neon/[0.08] px-4 py-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neon">
                Результат
              </div>
              <div className="font-mono text-2xl md:text-3xl font-semibold text-white tabular-nums">
                ~{formatMmSs(paceResultSecPerKm)}/км
              </div>
              <p className="text-xs text-white/55 mt-2">
                Середній темп на трасі без урахування варіацій по колу.
              </p>
            </div>
          : paceModeErrorMessage ?
            <p className="text-xs text-amber-400/95 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 opacity-85" aria-hidden />
              <span>{paceModeErrorMessage}</span>
            </p>
          : null}
        </>
      : <>
          {finishResultSecs !== null ?
            <div className="rounded-2xl border border-neon/25 bg-neon/[0.08] px-4 py-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neon">
                Прогнозований час пробігу
              </div>
              <div className="font-mono text-2xl md:text-3xl font-semibold text-white tabular-nums">
                ~{formatHms(finishResultSecs)}
              </div>
              <p className="text-xs text-white/55 mt-2">
                За умови рівномірного темпу; реальність залежить від профілю
                траси та вашої стратегії.
              </p>
            </div>
          : timeModeErrorMessage ?
            <p className="text-xs text-amber-400/95 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 opacity-85" aria-hidden />
              <span>{timeModeErrorMessage}</span>
            </p>
          : null}
        </>
      }
    </div>
  );
}
