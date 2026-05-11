import type { Organizer } from "@/types";

export const ORGANIZERS: Organizer[] = [
  {
    id: "org-1",
    name: "Run Ukraine",
    avatar:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=128&h=128&fit=crop",
    bio: "Найбільший організатор бігових подій в Україні. З пристрастю до бігу з 2010 року.",
    eventsCount: 24,
    rating: 4.9,
    city: "Київ",
    website: "https://runukraine.org",
    social: { telegram: "@runukraine", instagram: "@runukraine" },
  },
  {
    id: "org-2",
    name: "Carpathian Trail Club",
    avatar:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=128&h=128&fit=crop",
    bio: "Трейлові пригоди у серці Карпатських гір.",
    eventsCount: 12,
    rating: 4.8,
    city: "Буковель",
    social: { telegram: "@carpathiantrail", instagram: "@carpathian.trail" },
  },
  {
    id: "org-3",
    name: "Львівська спортивна федерація",
    avatar:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=128&h=128&fit=crop",
    bio: "Популяризація активного способу життя на заході України.",
    eventsCount: 18,
    rating: 4.7,
    city: "Львів",
    social: { telegram: "@lvivsport" },
  },
  {
    id: "org-4",
    name: "Odesa Beach Sports",
    avatar:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=128&h=128&fit=crop",
    bio: "Запливи на відкритій воді, пляжні забіги та триатлони біля Чорного моря.",
    eventsCount: 9,
    rating: 4.6,
    city: "Одеса",
    social: { telegram: "@odesabeach", instagram: "@odesa.beach.sports" },
  },
  {
    id: "org-5",
    name: "Dnipro Cycling Crew",
    avatar:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=128&h=128&fit=crop",
    bio: "Спільнота шосейного та гравійного велоспорту центральної України.",
    eventsCount: 15,
    rating: 4.8,
    city: "Дніпро",
    social: { telegram: "@dniprocycling" },
  },
  {
    id: "org-6",
    name: "Kharkiv Active",
    avatar:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=128&h=128&fit=crop",
    bio: "Мультиспортивні події у культурній столиці сходу України.",
    eventsCount: 11,
    rating: 4.7,
    city: "Харків",
    social: { telegram: "@kharkivactive" },
  },
  {
    id: "org-7",
    name: "Triathlon Kyiv",
    avatar:
      "https://images.unsplash.com/photo-1530143584546-02191bc84eb5?w=128&h=128&fit=crop",
    bio: "Плавай. Крути. Біжи. Головна триатлонна ліга столиці.",
    eventsCount: 7,
    rating: 4.9,
    city: "Київ",
    social: { telegram: "@triathlonkyiv", instagram: "@triathlon.kyiv" },
  },
  {
    id: "org-8",
    name: "Вінницькі бігуни",
    avatar:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=128&h=128&fit=crop",
    bio: "Місцеві герої бігової спільноти Вінниці.",
    eventsCount: 6,
    rating: 4.5,
    city: "Вінниця",
    social: { telegram: "@vinnytsiarunners" },
  },
];

export const getOrganizerById = (id: string): Organizer | undefined =>
  ORGANIZERS.find((o) => o.id === id);
