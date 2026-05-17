import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { AdminSection } from "@/components/sections/admin-section";
import { ChartsSection } from "@/components/sections/charts-section";
import { StatsSection } from "@/components/sections/stats-section";
import { AdminLogoutBar } from "@/components/admin/admin-logout-bar";
import { computeStats } from "@/lib/analytics";
import { fetchTelegramDashboard } from "@/lib/telegram-dashboard-cache";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Адмін-панель",
};

export default async function AdminDashboardPage() {
  const { events: EVENTS, logs } = await fetchTelegramDashboard();
  const stats = computeStats(EVENTS);

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-4">
        <div className="container mx-auto px-4 pt-[5.25rem] md:pt-[5.5rem] pb-4 flex justify-end gap-3">
          <AdminLogoutBar />
        </div>
        <StatsSection stats={stats} />
        <ChartsSection events={EVENTS} />
        <AdminSection events={EVENTS} logs={logs} />
      </main>
      <Footer />
      <MobileBottomNav />
      <FloatingActionButton />
    </>
  );
}
