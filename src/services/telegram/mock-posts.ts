import type { TelegramPost } from "@/types";

/**
 * Sample posts modeled on the @aigurtfartlek channel format.
 * Each post mixes Ukrainian and English to test the parser's tolerance.
 */
export const MOCK_TELEGRAM_POSTS: TelegramPost[] = [
  {
    id: "tg-1",
    channelId: "aigurtfartlek",
    channelName: "Fartlek Events UA",
    postId: 1042,
    text: `Kyiv Marathon 2026
4 жовтня 2026, Київ

The flagship marathon of Ukraine returns to the capital with a fast, certified course passing all major landmarks.
Distances: 42.2K, 21K, 10K, kids' run.

Реєстрація: https://runukraine.org/registration/kyiv-marathon-2026

#kyiv #marathon #fartlek`,
    date: "2026-01-12T10:14:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&h=800&fit=crop",
    ],
    links: ["https://runukraine.org/registration/kyiv-marathon-2026"],
    views: 18420,
  },
  {
    id: "tg-2",
    channelId: "aigurtfartlek",
    channelName: "Fartlek Events UA",
    postId: 1043,
    text: `Carpathian Ultra 100
30 серпня 2026, Bukovel

100K of brutal beauty across the Carpathian ridges. 5,500m of elevation gain, 30 hours cut-off.
Реєстрація і деталі: https://carpathiantrail.club/ultra-2026

#ultra #carpathians #trail`,
    date: "2026-02-04T08:30:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=800&fit=crop",
    ],
    links: ["https://carpathiantrail.club/ultra-2026"],
    views: 9410,
  },
  {
    id: "tg-3",
    channelId: "aigurtfartlek",
    channelName: "Fartlek Events UA",
    postId: 1044,
    text: `Odesa Open Water Swim 5K
19.07.2026, Одеса
Annual open water race in the warm waters of the Black Sea. Distances: 1K, 3K, 5K.
Register at https://swim.odesabeach.ua/2026

#swimming #odesa #openwater`,
    date: "2026-02-22T11:00:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&h=800&fit=crop",
    ],
    links: ["https://swim.odesabeach.ua/2026"],
    views: 5600,
  },
  {
    id: "tg-4",
    channelId: "aigurtfartlek",
    channelName: "Fartlek Events UA",
    postId: 1045,
    text: `Dnipro Ride 200 — Sign up now!
August 16, 2026 · Dnipro
A 200K closed-road gran fondo through the picturesque Dnipro region with multiple feed stations.
https://dniprocycling.org/ride200

#cycling #granfondo`,
    date: "2026-03-01T09:15:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1200&h=800&fit=crop",
    ],
    links: ["https://dniprocycling.org/ride200"],
    views: 4200,
  },
  {
    id: "tg-5",
    channelId: "aigurtfartlek",
    channelName: "Fartlek Events UA",
    postId: 1046,
    text: `Lviv Half Marathon
7 вересня 2026 · Львів
Run through the cobblestone streets of UNESCO-listed Lviv with thousands of locals and international runners.
Реєстрація: https://lvivhalfmarathon.com

#lviv #halfmarathon`,
    date: "2026-03-15T14:00:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&h=800&fit=crop",
    ],
    links: ["https://lvivhalfmarathon.com"],
    views: 7800,
  },
  {
    id: "tg-6",
    channelId: "aigurtfartlek",
    channelName: "Fartlek Events UA",
    postId: 1047,
    text: `Triathlon Kyiv Olympic
05.07.2026 — Київ, Trukhaniv island
Standard Olympic distance triathlon: 1.5K swim, 40K bike, 10K run.
Sign-up: https://triathlonkyiv.com/olympic

#triathlon #kyiv`,
    date: "2026-04-02T07:45:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1530143584546-02191bc84eb5?w=1200&h=800&fit=crop",
    ],
    links: ["https://triathlonkyiv.com/olympic"],
    views: 3300,
  },
  {
    id: "tg-7",
    channelId: "aigurtfartlek",
    channelName: "Fartlek Events UA",
    postId: 1048,
    text: `Vinnytsia Night Run 10K
14 червня 2026 · Вінниця
Glow-in-the-dark 10K through the lights of central Vinnytsia. LED bibs and music stations along the route.
https://vinnytsiarunners.org/night-run

#nightrun #vinnytsia`,
    date: "2026-04-18T20:00:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&h=800&fit=crop",
    ],
    links: ["https://vinnytsiarunners.org/night-run"],
    views: 2400,
  },
  {
    id: "tg-8",
    channelId: "aigurtfartlek",
    channelName: "Fartlek Events UA",
    postId: 1049,
    text: `Reminder: registration is closing soon!
Kharkiv Trail Challenge — 21.06.2026, Харків
30K trail with 1,200m+ of elevation through the forests around Kharkiv.
https://kharkivactive.club/trail-2026
#trail #kharkiv`,
    date: "2026-05-01T12:00:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&h=800&fit=crop",
    ],
    links: ["https://kharkivactive.club/trail-2026"],
    views: 1800,
  },
];
