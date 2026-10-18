import type { LocationQueryRaw } from "vue-router";
import { Tab, WeekDays } from "@/enums/enums";
import type { ResourceType } from "@/models/ResourceConflict";

/**
 * Der komplette Ansichtszustand der Planungsansicht.
 */
export type ViewState = {
  tab: Tab;
  /** Auswahl pro Tab (`?lecturer=3&room=5`), bleibt beim Tab-Wechsel erhalten */
  selected: Partial<Record<Tab, number>>;
  /** Angezeigte Semestergruppen (Spalten) im Veranstaltungs-Tab */
  studyGroups: number[];
  hiddenWeekdays: WeekDays[];
  showBreaks: boolean;
  /** Geteilte Ansicht bzw. Konflikt-Ansicht, wird nicht gespeichert */
  temp: boolean;
};

const allTabs = Object.values(Tab);
const allWeekdays = Object.values(WeekDays);

/**
 * @returns eine neue Standardansicht
 */
export function defaultView(): ViewState {
  return {
    tab: Tab.COURSE,
    selected: {},
    studyGroups: [],
    hiddenWeekdays: [],
    showBreaks: true,
    temp: false,
  };
}

/**
 * @returns alle String-Werte eines Query-Parameters
 */
function values(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === "string");
}

/**
 * @returns die ID, falls der String eine nicht-negative Ganzzahl ist, sonst undefined
 */
function toId(value: string | undefined): number | undefined {
  return value !== undefined && /^\d{1,15}$/.test(value) ? Number(value) : undefined;
}

/**
 * @returns sortierte IDs ohne Duplikate
 */
function normalizeIds(ids: number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}

/**
 * Liest den Ansichtszustand aus Query-Parametern. Ungültige Werte werden ignoriert und
 * fehlende durch Defaults ersetzt.
 *
 * @param query - `route.query` oder ein gespeichertes Query-Objekt
 * @returns gültigen Ansichtszustand
 */
export function parseViewQuery(query: Readonly<Record<string, unknown>>): ViewState {
  const tabParam = values(query.tab)[0];
  const tab = allTabs.find(t => t === tabParam) ?? Tab.COURSE;

  const selected: ViewState["selected"] = {};
  for (const t of allTabs) {
    const id = toId(values(query[t])[0]);
    if (id !== undefined) selected[t] = id;
  }
  // Links von vor der Umstellung: ?tab=room&id=5
  const legacyId = toId(values(query.id)[0]);
  if (legacyId !== undefined && selected[tab] === undefined) selected[tab] = legacyId;

  const hiddenWeekdays = values(query.hiddenWeekdays);

  return {
    tab,
    selected,
    studyGroups: normalizeIds(
      values(query.studyGroups)
        .map(toId)
        .filter((id): id is number => id !== undefined)
    ),
    hiddenWeekdays: allWeekdays.filter(day => hiddenWeekdays.includes(day)),
    showBreaks: values(query.showBreaks)[0] !== "false",
    temp: values(query.temp)[0] === "true",
  };
}

/**
 * Schreibt den Ansichtszustand als Query-Parameter. Defaults werden weggelassen,
 * die Standardansicht ergibt also `{}`.
 *
 * @param view - Ansichtszustand
 * @returns Query-Objekt für `router.push/replace`
 */
export function toViewQuery(view: ViewState): LocationQueryRaw {
  const query: LocationQueryRaw = {};
  if (view.tab !== Tab.COURSE) query.tab = view.tab;
  for (const t of allTabs) {
    const id = view.selected[t];
    if (id !== undefined) query[t] = String(id);
  }
  if (view.studyGroups.length > 0) query.studyGroups = normalizeIds(view.studyGroups).map(String);
  if (view.hiddenWeekdays.length > 0) {
    query.hiddenWeekdays = allWeekdays.filter(day => view.hiddenWeekdays.includes(day));
  }
  if (!view.showBreaks) query.showBreaks = "false";
  if (view.temp) query.temp = "true";
  return query;
}

/**
 * @returns ob zwei Ansichten dieselbe URL ergeben
 */
export function isSameView(a: ViewState, b: ViewState): boolean {
  return JSON.stringify(toViewQuery(a)) === JSON.stringify(toViewQuery(b));
}

/**
 * @returns der Tab, in dem eine Ressource eines Konflikts angezeigt wird
 */
export function resourceTypeToTab(type: ResourceType): Tab {
  switch (type) {
    case "lecturer":
      return Tab.LECTURER;
    case "room":
      return Tab.ROOM;
    case "study_group":
      return Tab.STUDYGROUP;
  }
}

/**
 * @returns eine temporäre Ansicht, die nur die Ressource eines Konflikts zeigt
 */
export function conflictView(type: ResourceType, id: number): ViewState {
  const tab = resourceTypeToTab(type);
  return { ...defaultView(), tab, selected: { [tab]: id }, temp: true };
}
