import { computed, ref } from "vue";
import type { StudyGroupTemplate } from "@/models/StudyGroupTemplate";

export type TemplateId = number;

export type TemplateDraft = {
  name: string;
  courseIds: TemplateId[];
};

/**
 * Zustand der rechten Spalte.
 */
export type PanelState =
  | { mode: "empty" }
  | { mode: "create" }
  | { mode: "edit"; templateId: TemplateId };

/**
 * Wohin gewechselt wird: in einen Zustand der rechten Spalte (leer, erstellen, bearbeiten)
 * oder aus dem Overlay heraus ("closed").
 */
export type TransitionTarget = PanelState | { mode: "closed" };

export type ConfirmRequest = {
  title: string;
  lines: string[];
  cancelLabel: string;
  okLabel: string;
};

/**
 * Alles, was das Composable von außen bekommt. So lässt es sich ohne Store testen.
 */
export type TemplateOverlayOptions = {
  /** Aktuelle Liste der Vorlagen */
  templates: () => StudyGroupTemplate[];
  /** Legt eine Vorlage an. Gibt die neue ID zurück, bei einem Fehler undefined */
  createTemplate: (draft: TemplateDraft) => Promise<TemplateId | undefined>;
  /** Speichert Änderungen. Gibt bei Erfolg true zurück */
  updateTemplate: (id: TemplateId, draft: TemplateDraft) => Promise<boolean>;
  /** Löscht eine Vorlage. Gibt bei Erfolg true zurück */
  deleteTemplate: (id: TemplateId) => Promise<boolean>;
  /** Markiert die Vorlage im Store */
  selectTemplate: (id: TemplateId | null) => void;
  /** Schließt das Overlay */
  closeOverlay: () => void;
};

/**
 * Prüft, ob der Entwurf vom Ausgangsstand abweicht.
 *
 * @param draft - aktuelle Eingaben
 * @param baseline - Stand beim Öffnen oder nach dem letzten Speichern
 * @returns true, wenn es Änderungen gibt
 */
export function hasChanges(draft: TemplateDraft, baseline: TemplateDraft): boolean {
  if (draft.name.trim() !== baseline.name.trim()) return true;

  const current = new Set(draft.courseIds);
  const original = new Set(baseline.courseIds);

  return current.size !== original.size || [...current].some(id => !original.has(id));
}

/**
 * Filtert Vorlagen nach Namen, ohne Groß- und Kleinschreibung.
 *
 * @param templates - alle Vorlagen
 * @param query - Suchbegriff, darf leer sein
 * @returns die passenden Vorlagen
 */
export function filterTemplates(
  templates: StudyGroupTemplate[],
  query: string
): StudyGroupTemplate[] {
  const needle = query.trim().toLocaleLowerCase("de");
  if (needle === "") return templates;

  return templates.filter(template => template.name.toLocaleLowerCase("de").includes(needle));
}

/**
 * Steuert das Overlay "Vorlagen verwalten": rechte Spalte, Entwurf, Rückfrage bei Änderungen,
 * Speichern und Löschen.
 *
 * @param options - Vorlagenliste und Aktionen von außen
 * @returns Zustand und Funktionen für das Overlay
 */
export function useTemplateOverlay(options: TemplateOverlayOptions) {
  const panel = ref<PanelState>({ mode: "empty" });
  const draft = ref<TemplateDraft | null>(null);
  const baseline = ref<TemplateDraft | null>(null);
  const pendingTarget = ref<TransitionTarget | null>(null);
  const deleteTargetId = ref<TemplateId | null>(null);
  const isSaving = ref<boolean>(false);
  const isDeleting = ref<boolean>(false);
  /** Zähler: Ändert er sich, soll der Cursor ins Namensfeld */
  const focusNameToken = ref<number>(0);

  /** true, solange gespeichert oder gelöscht wird */
  const isBusy = computed<boolean>(() => isSaving.value || isDeleting.value);

  const isDirty = computed<boolean>(() => {
    const current = draft.value;
    const original = baseline.value;
    return current !== null && original !== null && hasChanges(current, original);
  });

  /** Rückfrage, solange ein Wechsel wartet, sonst null */
  const confirmRequest = computed<ConfirmRequest | null>(() => {
    if (pendingTarget.value === null) return null;

    return {
      title:
        panel.value.mode === "create"
          ? "Erstellen der Vorlage abbrechen?"
          : "Änderungen verwerfen?",
      lines: ["Nicht gespeicherte Eingaben gehen verloren."],
      cancelLabel: "Weiter bearbeiten",
      okLabel: "Verwerfen",
    };
  });

  /** Vorlage, die gelöscht werden soll, sonst null */
  const deleteTarget = computed<StudyGroupTemplate | null>(() => {
    const id = deleteTargetId.value;
    if (id === null) return null;
    return findTemplate(id) ?? null;
  });

  /** Texte des Löschdialogs */
  const deleteLines = computed<string[]>(() => {
    const template = deleteTarget.value;
    if (template === null) return [];

    const lines = [
      `Die Vorlage „${template.name}“ wird endgültig gelöscht.`,
      "Das wirkt sich auch auf bestehende Zuweisungen aus.",
    ];

    if (isEditing(template.id) && isDirty.value) {
      lines.push("Nicht gespeicherte Änderungen gehen ebenfalls verloren.");
    }

    return lines;
  });

  /** Warum Speichern gesperrt ist. Leer, wenn es erlaubt ist. */
  const saveBlockReason = computed<string>(() => {
    const current = draft.value;
    if (current === null) return "";
    if (current.name.trim() === "") return "Bitte einen Namen eingeben.";
    if (panel.value.mode === "edit" && !isDirty.value) return "Keine Änderungen vorhanden.";
    return "";
  });

  const canSave = computed<boolean>(
    () => draft.value !== null && saveBlockReason.value === "" && !isBusy.value
  );

  /**
   * Kopiert einen Entwurf, damit Änderungen das Original nicht verändern.
   *
   * @param value - Entwurf, der kopiert werden soll
   * @returns neue Kopie
   */
  function cloneDraft(value: TemplateDraft): TemplateDraft {
    return { name: value.name, courseIds: [...value.courseIds] };
  }

  /**
   * Sucht eine Vorlage anhand der ID.
   *
   * @param id - ID der Vorlage
   * @returns die Vorlage oder undefined
   */
  function findTemplate(id: TemplateId): StudyGroupTemplate | undefined {
    return options.templates().find(template => template.id === id);
  }

  /**
   * Prüft, ob diese Vorlage gerade bearbeitet wird.
   *
   * @param id - ID der Vorlage
   * @returns true, wenn ihr Formular offen ist
   */
  function isEditing(id: TemplateId): boolean {
    return panel.value.mode === "edit" && panel.value.templateId === id;
  }

  /**
   * Liefert den Ausgangsstand: leer beim Erstellen, die gespeicherte Vorlage beim Bearbeiten.
   *
   * @param target - Zustand der rechten Spalte
   * @returns Ausgangsstand oder null, wenn es die Vorlage nicht gibt
   */
  function baselineFor(target: PanelState): TemplateDraft | null {
    if (target.mode === "create") return { name: "", courseIds: [] };
    if (target.mode === "edit") {
      const template = findTemplate(target.templateId);
      if (template === undefined) return null;
      return { name: template.name, courseIds: template.courses.map(course => course.id) };
    }

    return null;
  }

  /**
   * Wechselt den Zustand der rechten Spalte und setzt Entwurf und Ausgangsstand neu.
   *
   * @param target - neuer Zustand
   * @param savedDraft - gerade gespeicherte Daten. Nötig, solange der Store noch nicht aktuell ist.
   */
  function setPanel(target: PanelState, savedDraft?: TemplateDraft): void {
    const storedBaseline = savedDraft !== undefined ? cloneDraft(savedDraft) : baselineFor(target);

    if (target.mode === "empty" || storedBaseline === null) {
      panel.value = { mode: "empty" };
      baseline.value = null;
      draft.value = null;
      options.selectTemplate(null);
      return;
    }

    panel.value = target;
    baseline.value = storedBaseline;
    draft.value = cloneDraft(storedBaseline);
    options.selectTemplate(target.mode === "edit" ? target.templateId : null);
  }

  /**
   * Führt einen Wechsel ohne Rückfrage aus.
   *
   * @param target - Ziel des Wechsels
   */
  function applyTransition(target: TransitionTarget): void {
    if (target.mode === "closed") {
      setPanel({ mode: "empty" });
      options.closeOverlay();
      return;
    }

    setPanel(target);

    if (target.mode === "create") {
      focusNameToken.value++;
    }
  }

  /**
   * Startet einen Wechsel. Bei ungespeicherten Änderungen kommt zuerst die Rückfrage.
   *
   * @param target - Ziel des Wechsels
   */
  function requestTransition(target: TransitionTarget): void {
    if (isBusy.value) return;

    // Ist das Erstellformular schon offen, bleibt es unverändert und bekommt nur den Fokus.
    if (target.mode === "create" && panel.value.mode === "create") {
      focusNameToken.value++;
      return;
    }

    if (isDirty.value) {
      pendingTarget.value = target;
      return;
    }

    applyTransition(target);
  }

  /**
   * Öffnet das leere Erstellformular.
   */
  function requestCreate(): void {
    requestTransition({ mode: "create" });
  }

  /**
   * Klick auf eine Vorlage: Ist sie schon offen, wird sie geschlossen, sonst geöffnet.
   *
   * @param id - ID der angeklickten Vorlage
   */
  function onTemplateClick(id: TemplateId): void {
    requestTransition(isEditing(id) ? { mode: "empty" } : { mode: "edit", templateId: id });
  }

  /**
   * Will das Overlay schließen. Bei ungespeicherten Änderungen kommt zuerst die Rückfrage.
   */
  function requestClose(): void {
    requestTransition({ mode: "closed" });
  }

  /**
   * Rückfrage mit "Verwerfen" bestätigt: Der Wechsel wird ausgeführt.
   */
  function confirmPendingTransition(): void {
    const target = pendingTarget.value;
    pendingTarget.value = null;

    if (target !== null) {
      applyTransition(target);
    }
  }

  /**
   * Rückfrage abgebrochen: Alles bleibt, wie es ist.
   */
  function dismissPendingTransition(): void {
    pendingTarget.value = null;
  }

  /**
   * Öffnet den Löschdialog.
   *
   * @param id - ID der Vorlage, die gelöscht werden soll
   */
  function requestDelete(id: TemplateId): void {
    if (isBusy.value) return;
    deleteTargetId.value = id;
  }

  /**
   * Bricht das Löschen ab.
   */
  function cancelDelete(): void {
    deleteTargetId.value = null;
  }

  /**
   * Löscht die Vorlage. War sie offen, wird die rechte Spalte geleert.
   */
  async function confirmDelete(): Promise<void> {
    const id = deleteTargetId.value;
    if (id === null || isBusy.value) return;

    const wasEdited = isEditing(id);
    deleteTargetId.value = null;
    isDeleting.value = true;

    const success = await options.deleteTemplate(id);
    isDeleting.value = false;

    if (success && wasEdited) {
      setPanel({ mode: "empty" });
    }
  }

  /**
   * Setzt den Namen im Entwurf.
   *
   * @param name - neuer Name
   */
  function setName(name: string): void {
    if (draft.value === null) return;
    draft.value.name = name;
  }

  /**
   * Fügt eine Veranstaltung hinzu oder entfernt sie wieder.
   *
   * @param courseId - ID der Veranstaltung
   */
  function toggleCourse(courseId: TemplateId): void {
    const current = draft.value;
    if (current === null) return;

    current.courseIds = current.courseIds.includes(courseId)
      ? current.courseIds.filter(id => id !== courseId)
      : [...current.courseIds, courseId];
  }

  /**
   * Leert die Auswahl der Veranstaltungen. Der Name bleibt.
   */
  function resetCourseSelection(): void {
    if (draft.value === null) return;
    draft.value.courseIds = [];
  }

  /**
   * Speichert den Entwurf. Bei einem Fehler bleiben die Eingaben erhalten.
   */
  async function save(): Promise<void> {
    const current = draft.value;
    if (current === null || isBusy.value || saveBlockReason.value !== "") return;

    const target = panel.value;
    const savedDraft: TemplateDraft = {
      name: current.name.trim(),
      courseIds: [...current.courseIds],
    };

    isSaving.value = true;

    try {
      if (target.mode === "create") {
        const newId = await options.createTemplate(savedDraft);
        if (newId === undefined) return;

        setPanel({ mode: "edit", templateId: newId }, savedDraft);
        focusNameToken.value++;
        return;
      }

      if (target.mode === "edit") {
        const success = await options.updateTemplate(target.templateId, savedDraft);
        if (!success) return;

        baseline.value = cloneDraft(savedDraft);
        draft.value = cloneDraft(savedDraft);
      }
    } finally {
      isSaving.value = false;
    }
  }

  /**
   * Setzt alles zurück: rechte Spalte leer, keine offenen Dialoge.
   */
  function reset(): void {
    pendingTarget.value = null;
    deleteTargetId.value = null;
    setPanel({ mode: "empty" });
  }

  return {
    panel,
    draft,
    baseline,
    isDirty,
    isBusy,
    isSaving,
    isDeleting,
    confirmRequest,
    deleteTargetId,
    deleteTarget,
    deleteLines,
    saveBlockReason,
    canSave,
    focusNameToken,
    requestCreate,
    requestClose,
    onTemplateClick,
    confirmPendingTransition,
    dismissPendingTransition,
    requestDelete,
    cancelDelete,
    confirmDelete,
    setName,
    toggleCourse,
    resetCourseSelection,
    save,
    reset,
  };
}
