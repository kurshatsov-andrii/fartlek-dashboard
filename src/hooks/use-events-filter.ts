"use client";

import { useMemo, useState } from "react";
import { resolveEventCategory } from "@/lib/event-category";
import type {
  EventCategory,
  EventFilters,
  EventStatus,
  SportEvent,
} from "@/types";

const defaultFilters: EventFilters = {
  city: null,
  category: null,
  month: null,
  status: null,
  search: "",
};

export function useEventsFilter(events: SportEvent[]) {
  const [filters, setFilters] = useState<EventFilters>(defaultFilters);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filters.city && e.city !== filters.city) return false;
      if (
        filters.category &&
        resolveEventCategory(e) !== filters.category
      )
        return false;
      if (filters.status && e.status !== filters.status) return false;
      if (
        filters.month !== null &&
        new Date(e.date).getUTCMonth() !== filters.month
      )
        return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = (
          e.title +
          " " +
          e.city +
          " " +
          e.description +
          " " +
          e.organizerName +
          " " +
          e.tags.join(" ")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, filters]);

  const update = <K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const reset = () => setFilters(defaultFilters);

  const hasActive =
    !!filters.city ||
    !!filters.category ||
    filters.month !== null ||
    !!filters.status ||
    !!filters.search;

  return { filters, filtered, setFilter: update, reset, hasActive };
}

export type { EventCategory, EventStatus };
