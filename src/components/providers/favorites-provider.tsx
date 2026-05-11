"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY = "fartlek-favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const toggle = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const value = useMemo(
    () => ({ favorites, isFavorite, toggle, count: favorites.length }),
    [favorites, isFavorite, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
}
