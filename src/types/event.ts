export type EventStatus =
  | "registration_open"
  | "soon"
  | "finished"
  | "sold_out";

export type EventCategory =
  | "marathon"
  | "trail"
  | "ultra"
  | "cycling"
  | "swimming"
  | "triathlon"
  | "duathlon"
  | "kids"
  | "obstacle";

export type EventState = "upcoming" | "finished";

export interface Organizer {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  eventsCount: number;
  rating: number;
  city: string;
  website?: string;
  social?: {
    telegram?: string;
    instagram?: string;
    facebook?: string;
  };
}

export interface SportEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  image: string;
  date: string; // ISO date
  endDate?: string;
  city: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category: EventCategory;
  status: EventStatus;
  state: EventState;
  registrationLink: string;
  organizerId: string;
  organizerName: string;
  participants: number;
  maxParticipants?: number;
  views: number;
  tags: string[];
  distance?: string; // e.g. "42.2K", "21K"
  price?: number;
  featured?: boolean;
  weather?: {
    temp: number;
    condition: string;
  };
}

export interface EventFilters {
  city: string | null;
  category: EventCategory | null;
  month: number | null;
  status: EventStatus | null;
  search: string;
}

export interface TelegramPost {
  id: string;
  channelId: string;
  channelName: string;
  postId: number;
  text: string;
  date: string;
  images: string[];
  links: string[];
  views: number;
  rawHtml?: string;
}

export interface ParsedEventFromTelegram {
  source: "telegram";
  channelUrl: string;
  postId: number;
  title: string | null;
  date: string | null;
  description: string | null;
  city: string | null;
  registrationLink: string | null;
  images: string[];
  rawText: string;
  parsedAt: string;
  confidence: number; // 0..1
}

export interface ImportLogEntry {
  id: string;
  source: "telegram" | "manual" | "api";
  status: "success" | "partial" | "failed";
  message: string;
  eventsImported: number;
  timestamp: string;
}

export interface CityStat {
  city: string;
  count: number;
  lat: number;
  lng: number;
}
