import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { Hero } from "@/components/sections/hero";
import { EventsSection } from "@/components/sections/events-section";
import { CalendarSection } from "@/components/sections/calendar-section";
import { MapSection } from "@/components/sections/map-section";
import { TopEventsSection } from "@/components/sections/top-events-section";
import { OrganizersSection } from "@/components/sections/organizers-section";
import { FavoritesSection } from "@/components/sections/favorites-section";
import { computeStats } from "@/lib/analytics";
import { fetchTelegramDashboard } from "@/lib/telegram-dashboard-cache";
import { sportEventAbsoluteUrl } from "@/lib/event-detail";

export const revalidate = 600;

export const maxDuration = 300;

export default async function HomePage() {
  const { events: EVENTS, organizers } = await fetchTelegramDashboard();

  const UPCOMING_EVENTS = EVENTS.filter((e) => e.state === "upcoming").sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const FINISHED_EVENTS = EVENTS.filter((e) => e.state === "finished").sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const stats = computeStats(EVENTS);

  const nextEvent =
    [...UPCOMING_EVENTS]
      .filter((e) => new Date(e.date).getTime() >= Date.now())
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      )[0] ??
    UPCOMING_EVENTS[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Fartlek Події 2026",
    description:
      "Спортивні події України за даними дописів Telegram каналу @fartlekua.",
    numberOfItems: EVENTS.length,
    itemListElement: UPCOMING_EVENTS.slice(0, 10).map((e, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "SportsEvent",
        name: e.title,
        startDate: e.date,
        location: {
          "@type": "Place",
          name: e.city,
          address: { "@type": "PostalAddress", addressCountry: "UA" },
        },
        organizer: { "@type": "Organization", name: e.organizerName },
        url: sportEventAbsoluteUrl(e),
        sameAs: e.registrationLink,
      },
    })),
  };

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen">
        <Hero
          nextEvent={nextEvent}
          totalEvents={stats.totalEvents}
          citiesCount={stats.citiesCount}
        />
        <EventsSection upcoming={UPCOMING_EVENTS} finished={FINISHED_EVENTS} />
        <CalendarSection events={EVENTS} />
        <MapSection events={EVENTS} />
        <TopEventsSection events={EVENTS} upcoming={UPCOMING_EVENTS} />
        <OrganizersSection organizers={organizers} events={EVENTS} />
        <FavoritesSection events={EVENTS} />
      </main>
      <Footer />
      <MobileBottomNav />
      <FloatingActionButton />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
