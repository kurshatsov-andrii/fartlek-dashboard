# Fartlek Events 2026

> Premium dashboard for sports events in Ukraine — marathons, trails, cycling, swimming and triathlons.

Ultra-modern, dark-by-default, neon-accented sports UI built with Next.js 15, TypeScript, TailwindCSS, Framer Motion, Recharts and Lucide. Inspired by **Strava + Notion + Linear**.

## Highlights

- **Hero** with live event countdown and call-to-action.
- **Animated stats** for total / upcoming / finished events, revenue (events × 100 UAH), organizers, cities, participants and views.
- **Charts** — events per month, revenue per month, category distribution, upcoming vs finished pie. All animated via Recharts.
- **Events** — 50+ realistic Ukrainian sports events (30 upcoming, 20+ finished). Tabbed view, search and filters by city, category, month and status.
- **Calendar** with event dots and per-day drill-down.
- **Ukraine map** — stylized SVG outline with city dots sized by event count.
- **Top events** leaderboards: most viewed, top categories, upcoming this week.
- **Admin analytics panel** — revenue KPI, monthly growth chart, Telegram sync, import logs, latest events, quick-add form.
- **Telegram integration** — bilingual (uk/en) parser that extracts title, date, city, registration link and images from posts in the [`@aigurtfartlek`](https://t.me/aigurtfartlek) channel, plus a public mock API at `GET /api/telegram`.
- **Favorites** stored locally with bottom-nav badge.
- **Sharing** — Telegram / Twitter / Facebook / Copy-link.
- **Theme switch** — dark by default, light mode supported.
- **Mobile UX** — sticky navbar, bottom navigation, floating action button, glassmorphism cards.
- **SEO** — full Open Graph + Twitter metadata, JSON-LD `SportsEvent` list, robots and sitemap routes.

## Tech stack

| Area | Library |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript |
| Styling | TailwindCSS + custom glassmorphism utilities |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| UI primitives | Custom Shadcn-style `Button`, `Card`, `Tabs`, `Select`, `Input`, `Badge`, `Skeleton` |

## File structure

```
src/
├── app/                       App Router pages, layout, globals
│   ├── api/telegram/route.ts  Public Telegram import endpoint
│   ├── layout.tsx
│   ├── page.tsx               Main dashboard page
│   ├── robots.ts · sitemap.ts SEO metadata routes
│   └── globals.css            Global styles + glass utilities
├── components/
│   ├── event/                 Event card, status badge, category icon
│   ├── layout/                Navbar, footer, mobile nav, FAB, theme toggle
│   ├── providers/             Theme + Favorites contexts
│   ├── sections/              Hero, Stats, Charts, Events, Calendar, Map,
│   │                          Top, Organizers, Favorites, Admin
│   ├── ui/                    Button, Card, Tabs, Select, Input, Badge, Skeleton
│   └── widgets/               Countdown, animated counter, share, weather
├── data/                      Cities, organizers, mock events, import logs
├── hooks/                     useEventsFilter
├── lib/                       utils, date, analytics
├── services/telegram/         Parser, mock posts, fetch + import pipeline
└── types/                     Shared TypeScript types
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

### Docker (NGINX + TLS + Postgres + Compose-backend)

```bash
sh nginx/ssl/gen-self-signed.sh   # or place fullchain.pem / privkey.pem in nginx/ssl/
cp .env.example .env              # optional: variables interpolated by docker-compose.yml
docker compose up --build -d      # alternatively: docker-compose up --build -d
```

Open **https://localhost** (browser warning for self-signed certs). Next.js serves `/` and `/api/*`; the separate Compose `backend` is exposed via **https://localhost/svc/health**. **Docker Engine** must be running (Docker Desktop on Windows).

## Revenue model

Each event placement costs **100 UAH**.

```ts
revenue = totalEvents * 100;
```

This formula is applied consistently in the stats grid, monthly revenue chart and admin KPI card.

## Telegram parser

The dashboard ships a transport-agnostic parser at `src/services/telegram/parser.ts` that turns raw channel post text into a structured `ParsedEventFromTelegram` object with a confidence score (0–1).

- Recognizes **Ukrainian and English** dates (`12 червня 2026`, `12.06.2026`, `June 12, 2026`).
- Recognizes **22+ host cities** in both Latin and Cyrillic spellings.
- Picks the most likely **registration URL** from the post body and Telegram link attachments.
- Demo posts modeled after [`@aigurtfartlek`](https://t.me/aigurtfartlek) live in `src/services/telegram/mock-posts.ts`.
- A public read-only API is exposed at `GET /api/telegram` with `s-maxage=600, stale-while-revalidate=1800`.

To plug into the real Telegram preview endpoint, replace `fetchChannelPosts` in `src/services/telegram/index.ts` with an HTTP fetch of `https://t.me/s/aigurtfartlek` and parse the HTML with `cheerio` / `linkedom`.

## License

Demo project — not affiliated with any real sports federation. Imagery © Unsplash contributors.
