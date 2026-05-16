import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PaceCalculatorEmbeddedClientShell } from "@/components/tools/pace-calculator-client-shell";
import { ArrowLeft, Gauge } from "lucide-react";

export const metadata: Metadata = {
  title: "Калькулятор темпу — Fartlek",
  description:
    "Розрахунок середнього темпу (хв/км) за дистанцією та часом або прогнозованого часу за темпом для бігу на шосе.",
  openGraph: {
    title: "Калькулятор темпу — Fartlek",
    description:
      "Темп із фінішного часу та дистанції або час пробігу з темпу хв за кілометр.",
    locale: "uk_UA",
  },
};

export default function PaceCalculatorPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12 pt-[calc(5.5rem+env(safe-area-inset-top))] md:pt-[calc(6rem+env(safe-area-inset-top))]">
        <div className="container mx-auto px-4 max-w-xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-white/55 hover:text-neon transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            На головну
          </Link>
          <header className="mb-8">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/15 text-neon border border-neon/30">
                <Gauge className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold text-white md:text-[1.65rem]">
                  Калькулятор темпу
                </h1>
                <p className="text-sm text-white/55 mt-2 leading-relaxed">
                  Обчислення середнього темпу або часу пробігу (рівномірний темп,
                  без урахування профілю траси й погоди).
                </p>
              </div>
            </div>
          </header>
          <PaceCalculatorEmbeddedClientShell />
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
