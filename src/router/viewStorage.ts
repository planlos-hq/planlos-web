import { parseViewQuery, toViewQuery, type ViewState } from "./viewQuery";

const storageKey = "planlos.view";
/** Keys von vor der Umstellung, werden einmalig migriert */
const legacyKeys = ["hiddenWeekdays", "selectedStudyGroups", "showBreaks", "tab", "selectedId"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Lädt die gespeicherte Ansicht. Kaputte oder fehlende Daten ergeben `null`.
 *
 * @param storage - Speicher, Standard ist localStorage
 * @returns gespeicherte Ansicht oder null
 */
export function loadSavedView(storage?: Storage): ViewState | null {
  try {
    storage ??= localStorage;
    const raw = storage.getItem(storageKey);
    if (raw === null) return migrateLegacyView(storage);
    const query: unknown = JSON.parse(raw);
    return isRecord(query) ? { ...parseViewQuery(query), temp: false } : null;
  } catch {
    return null;
  }
}

/**
 * Speichert die Ansicht. Fehler (voller Speicher, kein localStorage) werden ignoriert.
 *
 * @param view - zu speichernde Ansicht
 * @param storage - Speicher, Standard ist localStorage (im Test austauschbar)
 * @returns ob die Ansicht gespeichert wurde
 */
export function saveView(view: ViewState, storage?: Storage): boolean {
  try {
    storage ??= localStorage;
    storage.setItem(storageKey, JSON.stringify(toViewQuery({ ...view, temp: false })));
    return true;
  } catch {
    // Ansicht wird dann eben nicht gespeichert
    return false;
  }
}

/**
 * Übernimmt die Einstellungen aus den alten Einzel-Keys und löscht diese.
 *
 * @returns migrierte Ansicht oder null, falls es keine alten Keys gibt
 */
function migrateLegacyView(storage: Storage): ViewState | null {
  if (legacyKeys.every(key => storage.getItem(key) === null)) return null;

  const read = (key: string): unknown => {
    try {
      return JSON.parse(storage.getItem(key) ?? "null");
    } catch {
      return null;
    }
  };
  const ids = (value: unknown) => (Array.isArray(value) ? value.map(String) : undefined);

  const view = parseViewQuery({
    tab: read("tab"),
    id: typeof read("selectedId") === "number" ? String(read("selectedId")) : undefined,
    studyGroups: ids(read("selectedStudyGroups")),
    hiddenWeekdays: read("hiddenWeekdays"),
    showBreaks: read("showBreaks") === false ? "false" : undefined,
  });

  // Alte Keys nur löschen, wenn die neue Ansicht wirklich gespeichert ist
  if (saveView(view, storage)) legacyKeys.forEach(key => storage.removeItem(key));
  return view;
}
