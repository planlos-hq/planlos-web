import { useRoute, useRouter, type LocationQueryValue } from "vue-router";
import type { PlannerSettings } from "@/models/PlannerSettings";
import { WeekDays } from "@/enums/enums";
import { Tab } from "@/enums/enums";

/**
 * Funktion zur Normalisierung der Query-Parameter.
 *
 * @returns - Query-Parameter in Form eines String-Arrays
 */
function normalizeArray(value: LocationQueryValue | LocationQueryValue[] | undefined): string[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value.map(String) : [value];
}

/**
 * Die Funktion stellt sicher, dass der String ein Wochentag (enum) ist
 *
 * @returns - Garantie, dass es sich um einen Wert des Enums "WeekDays" handelt
 */
function isWeekDay(value: string): value is WeekDays {
  return Object.values(WeekDays).includes(value as WeekDays);
}

/**
 * Die Funktion stellt sicher, dass der String ein Tab (enum) ist
 *
 * @returns - Garantie, dass es sich um einen Wert des Enums "Tab" handelt
 */
function isTab(value: string): value is Tab {
  return Object.values(Tab).includes(value as Tab);
}

/**
 * Composable zur Verwendung von Query-Parametern zum Verwalten der Kalendar-Einstellungen
 */
export function useQueryParameters() {
  const route = useRoute();
  const router = useRouter();

  /**
   * Die Funktion gibt die aktuellen Query-Parameter zurück
   *
   * @returns - ein Objekt des Typs PlannerSettings, dass die aktuellen Query-Parameter enthält
   */
  function getQueryParameters(): PlannerSettings {
    const settings: PlannerSettings = {
      hiddenWeekdays: normalizeArray(route.query.hiddenWeekdays).filter(isWeekDay),
      studyGroups: new Set(normalizeArray(route.query.studyGroups).map(Number)),
      showBreaks:
        route.query.showBreaks !== undefined
          ? route.query.showBreaks === "true"
          : JSON.parse(localStorage.getItem("showBreaks") ?? "true"),
      tab:
        typeof route.query.tab === "string" && isTab(route.query.tab)
          ? route.query.tab
          : Tab.COURSE,
      selectedId:
        route.query.id !== undefined && route.query.id !== null ? Number(route.query.id) : null,
      temp: route.query.temp !== undefined ? route.query.temp === "true" : false,
    };
    return settings;
  }

  /**
   * Die Funktion ändert die Query-Parameter auf die übergebenen Werte.
   */
  function setQueryParameters(plannerSettings: PlannerSettings) {
    router.replace({
      query: {
        hiddenWeekdays: plannerSettings.hiddenWeekdays,
        studyGroups: [...plannerSettings.studyGroups],
        showBreaks: plannerSettings.showBreaks.toString(),
        tab: plannerSettings.tab,
        id: plannerSettings.selectedId,
        temp: plannerSettings.temp.toString(),
      },
    });
  }

  /**
   * Die Funktion gibt die aktuelle Url inklusive Query-Parametern zurück.
   * Dabei wird `temporarySettings` immer auf true gesetzt.
   */
  function getShareableUrl(settings: PlannerSettings) {
    const url = new URL(window.location.pathname, window.location.origin);

    settings.hiddenWeekdays.forEach(day => {
      url.searchParams.append("hiddenWeekdays", day);
    });
    settings.studyGroups.forEach(id => {
      url.searchParams.append("studyGroups", id.toString());
    });
    url.searchParams.set("showBreaks", settings.showBreaks.toString());
    url.searchParams.set("tab", settings.tab);
    if (settings.selectedId !== null) {
      url.searchParams.set("id", settings.selectedId.toString());
    }
    url.searchParams.set("temp", "true");
    return url.toString();
  }

  /**
   * Die Funktion erzeugt eine gültige Url mit den richtigen Einstellungen für die Ansicht,
   * sodass der konkrete Konflikt aufgezeigt wird.
   *
   * @param settings -
   */
  function getConflictUrl(tab: Tab, id: number) {
    const url = new URL(window.location.pathname, window.location.origin);

    url.searchParams.set("showBreaks", "true");
    url.searchParams.set("tab", tab);
    url.searchParams.set("id", id.toString());
    url.searchParams.set("temp", "true");
    return url.toString();
  }

  return { getQueryParameters, setQueryParameters, getShareableUrl, getConflictUrl };
}
