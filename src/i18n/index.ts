import { watch } from "vue";
import { createI18n } from "vue-i18n";
import de from "./locales/de";
import en from "./locales/en";

const storageKey = "planlos-locale";
const supported = ["de", "en"];

/** Gespeicherte Sprache, sonst Deutsch. Fehler beim Zugriff auf localStorage werden ignoriert. */
function loadLocale(): string {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored !== null && supported.includes(stored) ? stored : "de";
  } catch {
    return "de";
  }
}

/** Sprachen für die Auswahl: Name in der jeweiligen Sprache, dahinter das Kürzel */
export const languageOptions = [
  { value: "de", text: "Deutsch | DE" },
  { value: "en", text: "English | EN" },
];

export const i18n = createI18n({
  legacy: false,
  locale: loadLocale(),
  fallbackLocale: "en",
  messages: { de, en },
});

// Sprachwechsel merken
watch(i18n.global.locale, value => {
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    // Speicher voll oder nicht verfügbar: Sprache gilt nur für diese Sitzung
  }
});
