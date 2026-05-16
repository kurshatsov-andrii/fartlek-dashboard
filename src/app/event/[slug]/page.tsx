import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  MapPin,
  Ruler,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { EventCoverImage } from "@/components/event/event-cover-image";
import { EventDetailAnalytics } from "@/components/event/event-detail-analytics";
import { StatusBadge } from "@/components/event/status-badge";
import { CategoryIcon } from "@/components/event/category-icon";
import { ShareButton } from "@/components/widgets/share-button";
import { Badge } from "@/components/ui/badge";
import { fetchTelegramDashboard } from "@/lib/telegram-dashboard-cache";
import { sportEventAbsoluteUrl } from "@/lib/event-detail";
import { categoryLabel } from "@/lib/analytics";
import { formatEventDate, formatEventDateLong } from "@/lib/date";
import { sortDistancesDisplayLine } from "@/lib/distance-sort";
import { organizerLatinInitials } from "@/lib/organizer-initials";
import { stripUrlsFromAfficheText } from "@/lib/affiche-text";

export const revalidate = 600;

export const maxDuration = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const { events } = await fetchTelegramDashboard();
  const event = events.find((e) => e.slug === slug);
  if (!event) {
    return { title: "Подія не знайдена" };
  }
  const canonical = sportEventAbsoluteUrl(event);
  return {
    title: `${event.title}`,
    description: `${event.city} · ${formatEventDate(event.date)}. Перегляди, реакції та порівняння з дашбордом.`,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: event.title,
      description: `Аналітика: ${event.city}, ${categoryLabel(event.category)}`,
    },
  };
}

export default async function EventAnalysisPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const { events } = await fetchTelegramDashboard();
  const event = events.find((e) => e.slug === slug);
  if (!event) notFound();

  const distanceLine = sortDistancesDisplayLine(event.distance ?? "");
  const affichePlain = stripUrlsFromAfficheText(event.description ?? "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.title,
    startDate: event.date,
    url: sportEventAbsoluteUrl(event),
    sameAs: event.registrationLink,
    location: {
      "@type": "Place",
      name: event.city,
      address: { "@type": "PostalAddress", addressCountry: "UA" },
    },
    organizer: { "@type": "Organization", name: event.organizerName },
  };

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pt-20 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-16 lg:pb-16">
        <div className="container mx-auto px-4 max-w-4xl mb-4">
          <Link
            href="/#events"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-neon transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Усі події
          </Link>
        </div>

        <section className="relative w-full bg-ink-900">
          <div className="relative w-full aspect-[16/7] min-h-[240px] sm:min-h-[280px] max-h-[min(70vh,640px)]">
            <EventCoverImage
              originalSrc={event.image}
              telegramPostUrl={event.registrationLink}
              alternateSrcs={event.imageAlternates}
              alt={event.title}
              titleHint="Фото з допису в Telegram"
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center gap-2 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={event.status} />
                <Badge variant="muted" className="backdrop-blur bg-ink-950/70">
                  <CategoryIcon category={event.category} className="h-3 w-3" />
                  {categoryLabel(event.category)}
                </Badge>
              </div>
              <ShareButton event={event} />
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-4xl -mt-6 sm:-mt-8 relative z-[1]">
          <div className="glass-strong rounded-3xl border border-white/10 p-6 md:p-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">
              {event.title}
            </h1>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-neon shrink-0" />
                {formatEventDateLong(event.date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neon shrink-0" />
                {event.city}
              </span>
              {distanceLine ? (
                <span className="inline-flex items-center gap-2 min-w-0">
                  <Ruler className="h-4 w-4 text-cyber-blue shrink-0" />
                  <span className="font-mono text-xs break-words">{distanceLine}</span>
                </span>
              ) : null}
            </div>

            {event.telegramPostDate ? (
              <p className="mt-2 text-xs text-white/45">
                Допис у Telegram: {formatEventDateLong(event.telegramPostDate)}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-11 w-11 rounded-full bg-gradient-to-br from-neon to-cyber-blue grid place-items-center text-sm font-bold font-mono text-ink-950 shrink-0">
                  {organizerLatinInitials(event.organizerName)}
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-white/45">Організатор</div>
                  <div className="text-sm font-medium break-words">
                    {event.organizerName}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <EventDetailAnalytics event={event} allEvents={events} />
            </div>

            {affichePlain ? (
              <div className="mt-8 pt-6 border-t border-white/10">
                <h2 className="font-display text-lg font-semibold mb-3">
                  Текст афіші
                </h2>
                <pre className="text-sm text-white/75 whitespace-pre-wrap font-sans leading-relaxed max-h-[420px] overflow-y-auto pr-2">
                  {affichePlain}
                </pre>
              </div>
            ) : null}

            <div className="mt-8 pt-6 border-t border-white/10">
              <a
                href={event.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-neon w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full"
              >
                <ExternalLink className="h-4 w-4" />
                Відкрити допис у Telegram
              </a>
            </div>
          </div>
        </div>
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
