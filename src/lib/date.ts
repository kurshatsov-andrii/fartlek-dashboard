import {
  format,
  formatDistanceToNowStrict,
  isSameDay,
  parseISO,
} from "date-fns";
import { uk } from "date-fns/locale";

export const formatEventDate = (iso: string): string => {
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: uk });
  } catch {
    return iso;
  }
};

export const formatEventDateLong = (iso: string): string => {
  try {
    return format(parseISO(iso), "EEEE, d MMMM yyyy", { locale: uk });
  } catch {
    return iso;
  }
};

export const fromNow = (iso: string): string => {
  try {
    return formatDistanceToNowStrict(parseISO(iso), {
      addSuffix: true,
      locale: uk,
    });
  } catch {
    return "";
  }
};

export { isSameDay, parseISO };
