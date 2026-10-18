import { defineStore } from "pinia";
import { computed, watch } from "vue";
import { START_LOCATION, useRouter } from "vue-router";
import { Tab, type WeekDays } from "@/enums/enums";
import type { ResourceType } from "@/models/ResourceConflict";
import {
  conflictView,
  defaultView,
  isSameView,
  parseViewQuery,
  toViewQuery,
  type ViewState,
} from "@/router/viewQuery";
import { loadSavedView, saveView } from "@/router/viewStorage";

type History = "push" | "replace";

/**
 * @returns Kopie der Auswahl ohne den Eintrag des Tabs
 */
function withoutTab(selected: ViewState["selected"], tab: Tab): ViewState["selected"] {
  const copy = { ...selected };
  delete copy[tab];
  return copy;
}

/**
 * @returns ob zwei Listen dieselben Einträge in derselben Reihenfolge haben
 */
function sameItems<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

/**
 * Pinia Store für den Ansichtszustand (Tab, Auswahl, Spalten, Wochentage, Pausen).
 * Die URL ist Source Of Truth: `view` wird aus `route.query` gelesen, Änderungen laufen
 * immer über den Router. Nicht-temporäre Ansichten werden zusätzlich im LocalStorage gespeichert.
 */
export const useViewStore = defineStore("view", () => {
  const router = useRouter();

  const view = computed(() => parseViewQuery(router.currentRoute.value.query));

  /** ID der Auswahl im aktuellen Tab, kann auf eine nicht (mehr) existierende Ressource zeigen */
  const selectedId = computed(() => view.value.selected[view.value.tab] ?? null);

  // `view` ist nach jeder Navigation ein neues Objekt. Diese Felder behalten bei gleichem Inhalt
  // ihre Referenz, damit abhängige Computeds (z. B. vue-cal-Spalten) nicht unnötig neu rechnen.
  const studyGroups = computed<number[]>(prev =>
    prev && sameItems(prev, view.value.studyGroups) ? prev : view.value.studyGroups
  );
  const hiddenWeekdays = computed<WeekDays[]>(prev =>
    prev && sameItems(prev, view.value.hiddenWeekdays) ? prev : view.value.hiddenWeekdays
  );

  /**
   * Ziel der zuletzt gestarteten, noch nicht abgeschlossenen Navigation. Mehrere Änderungen im
   * selben Tick bauen darauf auf, statt sich gegenseitig zu überschreiben.
   */
  let pending: ViewState | null = null;

  /**
   * Ändert die Ansicht, indem die URL geändert wird.
   *
   * @param change - berechnet die Änderung aus der aktuellen Ansicht
   * @param history - "push" erzeugt einen Eintrag für Zurück/Vor, "replace" nicht
   */
  async function update(
    change: (current: ViewState) => Partial<ViewState>,
    history: History = "replace"
  ) {
    const base = pending ?? view.value;
    const next = { ...base, ...change(base) };
    if (isSameView(base, next)) return;

    pending = next;
    const location = { query: toViewQuery(next) };
    try {
      await (history === "push" ? router.push(location) : router.replace(location));
    } finally {
      if (pending === next) pending = null;
    }
  }

  function patch(changes: Partial<ViewState>, history: History = "replace") {
    return update(() => changes, history);
  }

  function selectTab(tab: Tab) {
    return patch({ tab }, "push");
  }

  /**
   * @param tab - Tab, dessen Auswahl geändert wird
   * @param id - neue Auswahl, null hebt sie auf
   */
  function select(tab: Tab, id: number | null, history: History = "push") {
    return update(
      ({ selected }) => ({
        selected: id === null ? withoutTab(selected, tab) : { ...selected, [tab]: id },
      }),
      history
    );
  }

  /**
   * Entfernt eine gelöschte Ressource aus der Ansicht (Auswahl und Spalten).
   */
  function forget(tab: Tab, id: number) {
    return update(({ selected, studyGroups }) => ({
      selected: selected[tab] === id ? withoutTab(selected, tab) : selected,
      studyGroups: tab === Tab.STUDYGROUP ? studyGroups.filter(g => g !== id) : studyGroups,
    }));
  }

  /**
   * Entfernt alle IDs aus der Ansicht, deren Ressource nicht (mehr) existiert, z. B. nach dem Laden
   * der Daten, wenn Löschungen offline passiert sind.
   *
   * @param exists - prüft, ob die Ressource eines Tabs existiert
   */
  function prune(exists: (tab: Tab, id: number) => boolean) {
    return update(({ selected, studyGroups }) => ({
      selected: Object.fromEntries(
        Object.entries(selected).filter(([tab, id]) => id !== undefined && exists(tab as Tab, id))
      ),
      studyGroups: studyGroups.filter(id => exists(Tab.STUDYGROUP, id)),
    }));
  }

  /** Temporäre Ansicht als eigene übernehmen */
  function keepTemp() {
    return patch({ temp: false });
  }

  /** Temporäre Ansicht verlassen und zur gespeicherten zurückkehren */
  function discardTemp() {
    return update(() => loadSavedView() ?? defaultView());
  }

  /** Zeigt die Ressource eines Konflikts in einer temporären Ansicht, ohne Reload */
  function openConflict(type: ResourceType, id: number) {
    return update(() => conflictView(type, id), "push");
  }

  /** Link auf die aktuelle Ansicht, beim Öffnen temporär */
  const shareUrl = computed(() => {
    const { href } = router.resolve({ query: toViewQuery({ ...view.value, temp: true }) });
    return new URL(href, window.location.origin).toString();
  });

  watch(
    view,
    current => {
      // Vor der ersten Navigation ist die Route noch START_LOCATION (leere Query). Speichern
      // würde die gespeicherte Ansicht überschreiben, bevor der Router-Guard sie lädt.
      if (router.currentRoute.value === START_LOCATION || current.temp) return;
      saveView(current);
    },
    { immediate: true }
  );

  return {
    view,
    selectedId,
    studyGroups,
    hiddenWeekdays,
    update,
    patch,
    selectTab,
    select,
    forget,
    prune,
    keepTemp,
    discardTemp,
    openConflict,
    shareUrl,
  };
});
