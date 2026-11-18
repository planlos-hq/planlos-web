import { computed } from "vue";
import { useI18n } from "vue-i18n";

const minutesPerDay = 24 * 60;

/** Kleinbuchstaben ohne Punkte und Leerzeichen, damit "p.m.", "PM" und "pm" gleich sind */
const normalize = (text: string) => text.toLowerCase().replace(/[.\s]/g, "");

/**
 * Uhrzeiten für eine Sprache. Ob 12 oder 24 Stunden gilt, liefert Intl für die Sprache selbst
 * (de: 13:30, en: 1:30 PM) – neue Sprachen brauchen dafür keine Einstellung.
 *
 * @param locale - Sprache, z. B. "de" oder "en"
 * @returns Formatierung und Einlesen von Uhrzeiten
 */
export function createTimeFormat(locale: string) {
  /** true, wenn die Sprache Uhrzeiten mit AM/PM (o. Ä.) schreibt */
  const twelveHour = new Intl.DateTimeFormat(locale, { hour: "numeric" })
    .formatToParts(new Date(2000, 0, 1, 13))
    .some(p => p.type === "dayPeriod");

  const formatter = new Intl.DateTimeFormat(locale, {
    // 24 Stunden mit führender Null wie im Kalender (08:00), 12 Stunden ohne (8:00 AM)
    hour: twelveHour ? "numeric" : "2-digit",
    minute: "2-digit",
  });

  /** Vor- und Nachmittagskennung der Sprache (z. B. "am"/"pm"), normalisiert */
  const [am = "am", pm = "pm"] = [1, 13].map(hour => {
    const part = formatter
      .formatToParts(new Date(2000, 0, 1, hour))
      .find(p => p.type === "dayPeriod");
    return normalize(part?.value ?? (hour < 12 ? "am" : "pm"));
  });

  /**
   * @param date - Zeitpunkt
   * @returns Uhrzeit in der Sprache, z. B. "13:30" oder "1:30 PM"
   */
  const formatDate = (date: Date) => formatter.format(date);

  /**
   * @param minutes - Minuten seit Mitternacht (1440 = Mitternacht am Ende des Tages)
   * @returns Uhrzeit in der Sprache
   */
  const formatMinutes = (minutes: number) =>
    formatDate(new Date(2000, 0, 1, 0, minutes % minutesPerDay));

  /**
   * Liest eine eingetippte Uhrzeit, z. B. "13:30", "1330", "1:30 pm" oder "9".
   *
   * @param text - Eingabe
   * @returns Minuten seit Mitternacht oder undefined, wenn es keine gültige Uhrzeit ist
   */
  function parse(text: string): number | undefined {
    const match = /(\d{1,2})\s*[:.h]?\s*(\d{2})?/.exec(text);
    if (!match) return undefined;
    let hours = Number(match[1]);
    const minutes = Number(match[2] ?? 0);
    // Text neben der Uhrzeit: es zählt die Kennung mit dem längeren gemeinsamen Anfang,
    // so reichen auch "p" oder Vertipper wie "pa"; bei Gleichstand bleibt die Uhrzeit
    const rest = normalize(text.replace(match[0], ""));
    const sharedStart = (marker: string) => {
      let i = 0;
      while (i < rest.length && rest[i] === marker[i]) i++;
      return i;
    };
    const toPm = sharedStart(pm);
    const toAm = sharedStart(am);
    if (toPm > toAm && hours < 12) hours += 12;
    else if (toAm > toPm && hours === 12) hours = 0;
    if (hours > 23 || minutes > 59) return undefined;
    return hours * 60 + minutes;
  }

  return { twelveHour, formatDate, formatMinutes, parse };
}

/**
 * Uhrzeiten im Format der eingestellten Sprache; wechselt mit der Sprache.
 *
 * @returns wie createTimeFormat, twelveHour als computed
 */
export function useTimeFormat() {
  const { locale } = useI18n();
  const format = computed(() => createTimeFormat(locale.value));
  return {
    twelveHour: computed(() => format.value.twelveHour),
    formatDate: (date: Date) => format.value.formatDate(date),
    formatMinutes: (minutes: number) => format.value.formatMinutes(minutes),
    parse: (text: string) => format.value.parse(text),
  };
}

/**
 * @param minutes - Minuten seit Mitternacht
 * @returns Uhrzeit als "HH:MM" (24 Stunden), wie sie gespeichert und verrechnet wird
 */
export function toTimeValue(minutes: number) {
  const m = ((minutes % minutesPerDay) + minutesPerDay) % minutesPerDay;
  return `${Math.floor(m / 60)
    .toString()
    .padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
}
