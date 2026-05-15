import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { FartlekAssistantChat } from "@/components/assistant/fartlek-assistant-chat";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Fartlek AI — спортивний асистент",
  description:
    "Чат-асистент Fartlek: біг, трейли, вело, плавання, триатлон, темп, харчування та підготовка до стартів.",
  openGraph: {
    title: "Fartlek AI — спортивний асистент",
    description:
      "Спортивний помічник платформи Fartlek: практичні поради та навігація календарем подій.",
    locale: "uk_UA",
  },
};

export default function AssistantPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12 pt-[calc(5.5rem+env(safe-area-inset-top))] md:pt-[calc(6rem+env(safe-area-inset-top))]">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-white/55 hover:text-neon transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            На головну
          </Link>
          <FartlekAssistantChat />
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
