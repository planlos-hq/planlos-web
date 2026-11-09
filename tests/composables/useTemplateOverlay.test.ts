import { describe, expect, it, vi, type Mock } from "vitest";
import {
  filterTemplates,
  hasChanges,
  useTemplateOverlay,
  type TemplateDraft,
  type TemplateId,
} from "@/composables/useTemplateOverlay";
import type { Course } from "@/models/Course";
import type { StudyGroupTemplate } from "@/models/StudyGroupTemplate";

/**
 * Erzeugt eine Veranstaltung mit den für die Tests nötigen Feldern.
 *
 * @param id - ID der Veranstaltung
 * @returns die erfundene Veranstaltung
 */
function fakeCourse(id: TemplateId): Course {
  return {
    id,
    number: `${id}`,
    name: `Kurs ${id}`,
    abbreviation: `K${id}`,
    sws: 2,
    creditPoints: 3,
    lecturers: [],
    studyGroups: [],
    timeSlots: [],
  };
}

/**
 * Erzeugt eine Vorlage mit den Veranstaltungen der übergebenen IDs.
 *
 * @param id - ID der Vorlage
 * @param name - Name der Vorlage
 * @param courseIds - IDs der zugeordneten Veranstaltungen
 * @returns die erfundene Vorlage
 */
function fakeTemplate(
  id: TemplateId,
  name: string,
  courseIds: TemplateId[] = []
): StudyGroupTemplate {
  return { id, name, courses: courseIds.map(fakeCourse) };
}

type Fixture = {
  /** Die Vorlagenliste, die der Store normalerweise liefern würde */
  templates: StudyGroupTemplate[];
  overlay: ReturnType<typeof useTemplateOverlay>;
  createTemplate: Mock<(draft: TemplateDraft) => Promise<TemplateId | undefined>>;
  updateTemplate: Mock<(id: TemplateId, draft: TemplateDraft) => Promise<boolean>>;
  deleteTemplate: Mock<(id: TemplateId) => Promise<boolean>>;
  selectTemplate: Mock<(id: TemplateId | null) => void>;
  closeOverlay: Mock<() => void>;
};

/**
 * Baut das Overlay mit einer Speichervariante, deren Aktionen die Daten selbst verändern.
 *
 * @param templates - Vorlagen, die zu Beginn vorhanden sind
 * @returns die Vorlagenliste und das Overlay mit den protokollierten Aktionen
 */
function createFixture(templates: StudyGroupTemplate[] = []): Fixture {
  const createTemplate = vi.fn((draft: TemplateDraft): Promise<TemplateId | undefined> => {
    const created = fakeTemplate(100, draft.name, draft.courseIds);
    templates.push(created);

    return Promise.resolve(created.id);
  });

  const updateTemplate = vi.fn((id: TemplateId, draft: TemplateDraft): Promise<boolean> => {
    const template = templates.find(item => item.id === id);
    if (template === undefined) return Promise.resolve(false);

    template.name = draft.name;
    template.courses = draft.courseIds.map(fakeCourse);

    return Promise.resolve(true);
  });

  const deleteTemplate = vi.fn((id: TemplateId): Promise<boolean> => {
    const index = templates.findIndex(item => item.id === id);
    if (index === -1) return Promise.resolve(false);

    templates.splice(index, 1);

    return Promise.resolve(true);
  });

  const selectTemplate = vi.fn();
  const closeOverlay = vi.fn();

  const overlay = useTemplateOverlay({
    templates: () => templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate,
    closeOverlay,
  });

  return {
    templates,
    overlay,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate,
    closeOverlay,
  };
}

/**
 * Öffnet das Erstellformular und füllt es mit den angegebenen Eingaben.
 *
 * @param fixture - das Test-Overlay
 * @param name - Name, der eingetragen werden soll
 * @param courseIds - Veranstaltungen, die ausgewählt werden sollen
 */
function startCreate(fixture: Fixture, name = "Neue Vorlage", courseIds: TemplateId[] = []): void {
  fixture.overlay.requestCreate();

  fixture.overlay.setName(name);

  for (const courseId of courseIds) {
    fixture.overlay.toggleCourse(courseId);
  }
}

describe("hasChanges", () => {
  it("ignoriert führende und nachfolgende Leerzeichen im Namen", () => {
    expect(hasChanges({ name: "  Test  ", courseIds: [] }, { name: "Test", courseIds: [] })).toBe(
      false
    );
  });

  it("vergleicht Veranstaltungen als Menge, ohne Reihenfolge", () => {
    expect(
      hasChanges({ name: "Test", courseIds: [3, 1, 2] }, { name: "Test", courseIds: [1, 2, 3] })
    ).toBe(false);
  });

  it("erkennt eine hinzugefügte und eine entfernte Veranstaltung", () => {
    expect(hasChanges({ name: "Test", courseIds: [1, 2] }, { name: "Test", courseIds: [1] })).toBe(
      true
    );
    expect(hasChanges({ name: "Test", courseIds: [1] }, { name: "Test", courseIds: [1, 2] })).toBe(
      true
    );
  });

  it("zählt eine rückgängig gemachte Änderung nicht als Änderung", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1])]);
    fixture.overlay.onTemplateClick(1);

    fixture.overlay.toggleCourse(2);
    expect(fixture.overlay.isDirty.value).toBe(true);

    fixture.overlay.toggleCourse(2);
    expect(fixture.overlay.isDirty.value).toBe(false);
  });

  it("erkennt eine rückgängig gemachte Namensänderung nicht als Änderung", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    fixture.overlay.onTemplateClick(1);

    fixture.overlay.setName("");
    expect(fixture.overlay.isDirty.value).toBe(true);

    fixture.overlay.setName("Vorlage A");
    expect(fixture.overlay.isDirty.value).toBe(false);
  });
});

describe("filterTemplates", () => {
  const templates = [fakeTemplate(1, "Informatik"), fakeTemplate(2, "Mathe")];

  it("liefert ohne Suchbegriff alle Vorlagen", () => {
    expect(filterTemplates(templates, "")).toEqual(templates);
  });

  it("filtert ohne Beachtung der Groß- und Kleinschreibung", () => {
    expect(filterTemplates(templates, "inFORMAT").map(template => template.id)).toEqual([1]);
  });

  it("liefert keine Vorlage, wenn nichts passt", () => {
    expect(filterTemplates(templates, "Physik")).toEqual([]);
  });

  it("verändert weder die Liste noch die Vorlagen selbst", () => {
    const copy = [fakeTemplate(1, "Informatik"), fakeTemplate(2, "Mathe")];
    filterTemplates(copy, "mat");

    expect(copy).toHaveLength(2);
    expect(copy[0]?.name).toBe("Informatik");
  });
});

describe("Zustände beim Öffnen", () => {
  it("startet immer im Leerzustand ohne Entwurf", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);

    expect(fixture.overlay.panel.value).toEqual({ mode: "empty" });
    expect(fixture.overlay.draft.value).toBeNull();
    expect(fixture.overlay.isDirty.value).toBe(false);
  });

  it("setzt das Overlay beim Öffnen in den Leerzustand zurück", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    startCreate(fixture, "Entwurf");
    fixture.overlay.reset();

    expect(fixture.overlay.panel.value).toEqual({ mode: "empty" });
    expect(fixture.overlay.draft.value).toBeNull();
  });
});

describe("Übergänge ohne ungespeicherte Änderungen", () => {
  it("öffnet empty durch den +-Button das Erstellformular", () => {
    const fixture = createFixture();
    fixture.overlay.requestCreate();

    expect(fixture.overlay.panel.value).toEqual({ mode: "create" });
    expect(fixture.overlay.draft.value).toEqual({ name: "", courseIds: [] });
    expect(fixture.overlay.confirmRequest.value).toBeNull();
    expect(fixture.overlay.focusNameToken.value).toBe(1);
  });

  it("öffnet empty durch einen Klick auf eine Vorlage den Bearbeitungsmodus", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1, 2])]);
    fixture.overlay.onTemplateClick(1);

    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
    expect(fixture.overlay.draft.value).toEqual({ name: "Vorlage A", courseIds: [1, 2] });
    expect(fixture.selectTemplate).toHaveBeenCalledWith(1);
  });

  it("hält das Erstellformular offen und ändert keine Eingaben beim erneuten Klick auf +-Button", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    startCreate(fixture, "Entwurf", [2]);
    const tokenBefore = fixture.overlay.focusNameToken.value;

    fixture.overlay.requestCreate();

    expect(fixture.overlay.panel.value).toEqual({ mode: "create" });
    expect(fixture.overlay.draft.value).toEqual({ name: "Entwurf", courseIds: [2] });
    expect(fixture.overlay.confirmRequest.value).toBeNull();
    expect(fixture.overlay.focusNameToken.value).toBe(tokenBefore + 1);
  });

  it("schließt den Bearbeitungsmodus durch einen erneuten Klick auf die aktive Vorlage", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1])]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.onTemplateClick(1);

    expect(fixture.overlay.panel.value).toEqual({ mode: "empty" });
    expect(fixture.selectTemplate).toHaveBeenLastCalledWith(null);
  });

  it("wechselt edit direkt zu einer anderen Vorlage", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A"), fakeTemplate(2, "Vorlage B")]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.onTemplateClick(2);

    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 2 });
    expect(fixture.overlay.confirmRequest.value).toBeNull();
  });

  it("schließt edit direkt über den +-Button in das Erstellformular", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.requestCreate();

    expect(fixture.overlay.panel.value).toEqual({ mode: "create" });
  });

  it("schließt das Overlay ohne Rückfrage bei unberührtem Erstellformular", () => {
    const fixture = createFixture();
    fixture.overlay.requestCreate();
    fixture.overlay.requestClose();

    expect(fixture.overlay.confirmRequest.value).toBeNull();
    expect(fixture.closeOverlay).toHaveBeenCalled();
  });
});

describe("Sicherheitsabfrage bei ungespeicherten Änderungen", () => {
  it("öffnet empty ohne Abfrage, obwohl nichts geändert wurde", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    startCreate(fixture);
    fixture.overlay.setName("");
    fixture.overlay.requestClose();

    expect(fixture.overlay.confirmRequest.value).toBeNull();
  });

  it("hält create und Eingaben erhalten, während die Abfrage offen ist", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    startCreate(fixture, "Entwurf", [2]);
    fixture.overlay.onTemplateClick(1);

    expect(fixture.overlay.panel.value).toEqual({ mode: "create" });
    expect(fixture.overlay.draft.value).toEqual({ name: "Entwurf", courseIds: [2] });
    expect(fixture.overlay.confirmRequest.value).toEqual({
      title: "Erstellen der Vorlage abbrechen?",
      lines: ["Nicht gespeicherte Eingaben gehen verloren."],
      cancelLabel: "Weiter bearbeiten",
      okLabel: "Verwerfen",
    });
    expect(fixture.selectTemplate).toHaveBeenCalledWith(null);
  });

  it("führt create den angeforderten Übergang nach Verwerfen aus", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1])]);
    startCreate(fixture, "Entwurf", [2]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.confirmPendingTransition();

    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
    expect(fixture.overlay.draft.value).toEqual({ name: "Vorlage A", courseIds: [1] });
    expect(fixture.overlay.isDirty.value).toBe(false);
  });

  it("behält edit Zustand und Eingaben nach 'Weiter bearbeiten'", () => {
    const fixture = createFixture([
      fakeTemplate(1, "Vorlage A", [1]),
      fakeTemplate(2, "Vorlage B"),
    ]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.setName("Vorlage A geändert");
    fixture.overlay.onTemplateClick(2);
    fixture.overlay.dismissPendingTransition();

    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
    expect(fixture.overlay.draft.value).toEqual({ name: "Vorlage A geändert", courseIds: [1] });
    expect(fixture.selectTemplate).toHaveBeenLastCalledWith(1);
    expect(fixture.closeOverlay).not.toHaveBeenCalled();
  });

  it("öffnet edit die Abfrage mit dem Titel 'Änderungen verwerfen?'", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.setName("Neuer Name");
    fixture.overlay.requestClose();

    expect(fixture.overlay.confirmRequest.value?.title).toBe("Änderungen verwerfen?");
  });

  it("führt edit den Übergang zu einer anderen Vorlage nach Verwerfen aus", () => {
    const fixture = createFixture([
      fakeTemplate(1, "Vorlage A"),
      fakeTemplate(2, "Vorlage B", [3]),
    ]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.toggleCourse(7);
    fixture.overlay.onTemplateClick(2);
    expect(fixture.overlay.confirmRequest.value).not.toBeNull();

    fixture.overlay.confirmPendingTransition();

    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 2 });
    expect(fixture.overlay.draft.value).toEqual({ name: "Vorlage B", courseIds: [3] });
  });

  it("wechselt edit durch den +-Button erst nach Verwerfen in das Erstellformular", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.setName("Neuer Name");
    fixture.overlay.requestCreate();
    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });

    fixture.overlay.confirmPendingTransition();

    expect(fixture.overlay.panel.value).toEqual({ mode: "create" });
    expect(fixture.overlay.draft.value).toEqual({ name: "", courseIds: [] });
  });

  it("schließt das Overlay edit erst nach Verwerfen", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.toggleCourse(4);
    fixture.overlay.requestClose();
    expect(fixture.closeOverlay).not.toHaveBeenCalled();

    fixture.overlay.confirmPendingTransition();

    expect(fixture.closeOverlay).toHaveBeenCalled();
    expect(fixture.overlay.panel.value).toEqual({ mode: "empty" });
  });
});

describe("Suche im linken Bereich", () => {
  it("verändert die Suche weder Auswahl noch Änderungsstatus", () => {
    const fixture = createFixture([
      fakeTemplate(1, "Vorlage A", [1]),
      fakeTemplate(2, "Vorlage B"),
    ]);
    fixture.overlay.onTemplateClick(1);
    const dirtyBefore = fixture.overlay.isDirty.value;
    const draftBefore = fixture.overlay.draft.value;

    const hits = filterTemplates(fixture.templates, "B");

    expect(hits.map(template => template.id)).toEqual([2]);
    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
    expect(fixture.overlay.draft.value).toEqual(draftBefore);
    expect(fixture.overlay.isDirty.value).toBe(dirtyBefore);
  });

  it("öffnet eine herausgefilterte Vorlage weiterhin im Bearbeitungsmodus", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A"), fakeTemplate(2, "Vorlage B")]);
    const hits = filterTemplates(fixture.templates, "B");

    expect(hits.some(template => template.id === 1)).toBe(false);

    fixture.overlay.onTemplateClick(1);

    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
  });
});

describe("Speichern", () => {
  it("öffnet empty nach dem Speichern die neue Vorlage im Bearbeitungsmodus", async () => {
    const fixture = createFixture();
    startCreate(fixture, "Neue Vorlage", [1, 2]);

    await fixture.overlay.save();

    expect(fixture.createTemplate).toHaveBeenCalledWith({
      name: "Neue Vorlage",
      courseIds: [1, 2],
    });
    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 100 });
    expect(fixture.overlay.isDirty.value).toBe(false);
    expect(fixture.overlay.canSave.value).toBe(false);
    expect(fixture.selectTemplate).toHaveBeenLastCalledWith(100);
  });

  it("hält edit nach dem Speichern offen und setzt den Ausgangsstand", async () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1])]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.setName("Vorlage A neu");
    fixture.overlay.toggleCourse(2);

    await fixture.overlay.save();

    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
    expect(fixture.overlay.baseline.value).toEqual({ name: "Vorlage A neu", courseIds: [1, 2] });
    expect(fixture.overlay.isDirty.value).toBe(false);
    expect(fixture.templates[0]?.name).toBe("Vorlage A neu");
  });

  it("deaktiviert 'Speichern' ohne Namen und ohne Änderungen", async () => {
    const empty = createFixture();
    expect(empty.overlay.canSave.value).toBe(false);

    const created = createFixture();
    startCreate(created, "  ", [1]);
    expect(created.overlay.canSave.value).toBe(false);
    expect(created.overlay.saveBlockReason.value).toBe("Bitte einen Namen eingeben.");

    const edited = createFixture([fakeTemplate(1, "Vorlage A", [1])]);
    edited.overlay.onTemplateClick(1);
    expect(edited.overlay.canSave.value).toBe(false);
    expect(edited.overlay.saveBlockReason.value).toBe("Keine Änderungen vorhanden.");
  });

  it("erlaubt edit nach einem Reset, wenn die Vorlage Veranstaltungen hatte", async () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1, 2])]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.resetCourseSelection();

    expect(fixture.overlay.canSave.value).toBe(true);
    expect(fixture.overlay.draft.value).toEqual({ name: "Vorlage A", courseIds: [] });

    await fixture.overlay.save();

    expect(fixture.overlay.isDirty.value).toBe(false);
    expect(fixture.templates[0]?.courses).toEqual([]);
  });

  it("erhält die Eingaben, wenn das Speichern fehlschlägt", async () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1])]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.setName("Neuer Name");
    fixture.updateTemplate.mockResolvedValueOnce(false);

    await fixture.overlay.save();

    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
    expect(fixture.overlay.draft.value).toEqual({ name: "Neuer Name", courseIds: [1] });
    expect(fixture.overlay.baseline.value).toEqual({ name: "Vorlage A", courseIds: [1] });
    expect(fixture.overlay.isDirty.value).toBe(true);
  });

  it("hält den Entwurf, wenn das Erstellen fehlschlägt", async () => {
    const fixture = createFixture();
    startCreate(fixture, "Entwurf", [1]);
    fixture.createTemplate.mockResolvedValueOnce(undefined);

    await fixture.overlay.save();

    expect(fixture.overlay.panel.value).toEqual({ mode: "create" });
    expect(fixture.overlay.draft.value).toEqual({ name: "Entwurf", courseIds: [1] });
  });

  it("erspart ein mehrfaches Absenden während des Speicherns", async () => {
    const fixture = createFixture();
    let releaseSave: (() => void) | undefined;
    fixture.createTemplate.mockImplementationOnce(
      () =>
        new Promise<TemplateId | undefined>(resolve => {
          releaseSave = () => resolve(100);
        })
    );

    startCreate(fixture, "Neue Vorlage", [1]);
    const saving = fixture.overlay.save();
    expect(fixture.overlay.isSaving.value).toBe(true);
    expect(fixture.overlay.canSave.value).toBe(false);

    await fixture.overlay.save();
    expect(fixture.createTemplate).toHaveBeenCalledTimes(1);

    releaseSave?.();
    await saving;

    expect(fixture.overlay.isSaving.value).toBe(false);
  });

  it("sperrt alle Übergänge während eines laufenden Speicherns", async () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    let releaseSave: (() => void) | undefined;
    fixture.createTemplate.mockImplementationOnce(
      () =>
        new Promise<TemplateId | undefined>(resolve => {
          releaseSave = () => resolve(100);
        })
    );

    startCreate(fixture, "Neue Vorlage");
    const saving = fixture.overlay.save();

    fixture.overlay.onTemplateClick(1);
    fixture.overlay.requestCreate();
    fixture.overlay.requestClose();
    expect(fixture.overlay.panel.value).toEqual({ mode: "create" });
    expect(fixture.closeOverlay).not.toHaveBeenCalled();

    releaseSave?.();
    await saving;
  });
});

describe("Löschen", () => {
  it("öffnet den Löschdialog, ohne die rechte Spalte zu verändern", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    fixture.overlay.requestDelete(1);

    expect(fixture.overlay.deleteTarget.value?.id).toBe(1);
    expect(fixture.overlay.panel.value).toEqual({ mode: "empty" });
    expect(fixture.deleteTemplate).not.toHaveBeenCalled();
  });

  it("weist der Löschtext auf bestehende Zuweisungen hin", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    fixture.overlay.requestDelete(1);

    expect(fixture.overlay.deleteLines.value).toEqual([
      "Die Vorlage „Vorlage A“ wird endgültig gelöscht.",
      "Das wirkt sich auch auf bestehende Zuweisungen aus.",
    ]);
  });

  it("weist beim Löschen der bearbeiteten Vorlage zusätzlich auf ungespeicherte Änderungen hin", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1])]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.setName("Vorlage A geändert");
    fixture.overlay.requestDelete(1);

    expect(fixture.overlay.deleteLines.value).toContain(
      "Nicht gespeicherte Änderungen gehen ebenfalls verloren."
    );
  });

  it("zeigt beim Löschen nur eine Abfrage, nie die Sicherheitsabfrage", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1])]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.toggleCourse(9);
    fixture.overlay.requestDelete(1);

    expect(fixture.overlay.deleteTargetId.value).toBe(1);
    expect(fixture.overlay.confirmRequest.value).toBeNull();
  });

  it("hält empty beim Löschen einer Vorlage", async () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A"), fakeTemplate(2, "Vorlage B")]);
    fixture.overlay.requestDelete(1);
    await fixture.overlay.confirmDelete();

    expect(fixture.overlay.panel.value).toEqual({ mode: "empty" });
    expect(fixture.templates.map(template => template.id)).toEqual([2]);
  });

  it("hält create und Entwurf beim Löschen einer anderen Vorlage", async () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A"), fakeTemplate(2, "Vorlage B")]);
    startCreate(fixture, "Entwurf", [5]);
    fixture.overlay.requestDelete(1);
    await fixture.overlay.confirmDelete();

    expect(fixture.overlay.panel.value).toEqual({ mode: "create" });
    expect(fixture.overlay.draft.value).toEqual({ name: "Entwurf", courseIds: [5] });
  });

  it("wechselt edit zu empty, wenn die bearbeitete Vorlage gelöscht wird", async () => {
    const fixture = createFixture([
      fakeTemplate(1, "Vorlage A", [1]),
      fakeTemplate(2, "Vorlage B"),
    ]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.requestDelete(1);
    await fixture.overlay.confirmDelete();

    expect(fixture.overlay.panel.value).toEqual({ mode: "empty" });
    expect(fixture.overlay.draft.value).toBeNull();
  });

  it("hält edit(X) und Entwurf beim Löschen einer anderen Vorlage Y", async () => {
    const fixture = createFixture([
      fakeTemplate(1, "Vorlage A", [1]),
      fakeTemplate(2, "Vorlage B"),
    ]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.setName("Vorlage A geändert");
    fixture.overlay.requestDelete(2);
    await fixture.overlay.confirmDelete();

    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
    expect(fixture.overlay.draft.value).toEqual({ name: "Vorlage A geändert", courseIds: [1] });
    expect(fixture.templates.map(template => template.id)).toEqual([1]);
  });

  it("hält Vorlage, Zustand und Entwurf, wenn das Löschen fehlschlägt", async () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1])]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.setName("Vorlage A geändert");
    fixture.deleteTemplate.mockResolvedValueOnce(false);

    fixture.overlay.requestDelete(1);
    await fixture.overlay.confirmDelete();

    expect(fixture.templates.map(template => template.id)).toEqual([1]);
    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
    expect(fixture.overlay.draft.value).toEqual({ name: "Vorlage A geändert", courseIds: [1] });
  });

  it("bricht den Löschdialog ab, ohne etwas zu ändern", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.requestDelete(1);
    fixture.overlay.cancelDelete();

    expect(fixture.overlay.deleteTargetId.value).toBeNull();
    expect(fixture.deleteTemplate).not.toHaveBeenCalled();
    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
  });

  it("sperrt Übergänge während eines laufenden Löschens", async () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A"), fakeTemplate(2, "Vorlage B")]);
    let releaseDelete: (() => void) | undefined;
    fixture.deleteTemplate.mockImplementationOnce(
      () =>
        new Promise<boolean>(resolve => {
          releaseDelete = () => resolve(true);
        })
    );

    startCreate(fixture, "Entwurf", [5]);
    fixture.overlay.requestDelete(1);
    const deleting = fixture.overlay.confirmDelete();
    expect(fixture.overlay.isDeleting.value).toBe(true);

    fixture.overlay.onTemplateClick(2);
    fixture.overlay.requestCreate();
    fixture.overlay.requestClose();
    expect(fixture.overlay.panel.value).toEqual({ mode: "create" });
    expect(fixture.overlay.draft.value).toEqual({ name: "Entwurf", courseIds: [5] });

    releaseDelete?.();
    await deleting;

    expect(fixture.overlay.isDeleting.value).toBe(false);
  });
});

describe("Auswahl der Veranstaltungen", () => {
  it("wählt eine Veranstaltung zu und wieder ab", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    fixture.overlay.onTemplateClick(1);

    fixture.overlay.toggleCourse(2);
    expect(fixture.overlay.draft.value?.courseIds).toEqual([2]);

    fixture.overlay.toggleCourse(2);
    expect(fixture.overlay.draft.value?.courseIds).toEqual([]);
  });

  it("wählt durch einen erneuten Klick dieselbe Veranstaltung wieder ab", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A")]);
    fixture.overlay.onTemplateClick(1);

    fixture.overlay.toggleCourse(2);
    fixture.overlay.toggleCourse(2);

    expect(fixture.overlay.draft.value?.courseIds).toEqual([]);
  });

  it("entfernt beim Reset alle Veranstaltungen und lässt den Namen erhalten", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1, 2])]);
    fixture.overlay.onTemplateClick(1);
    fixture.overlay.setName("Neuer Name");
    fixture.overlay.resetCourseSelection();

    expect(fixture.overlay.draft.value).toEqual({ name: "Neuer Name", courseIds: [] });
  });

  it("entfernt über das Tag dieselbe Veranstaltung wie über die Liste", () => {
    const fixture = createFixture([fakeTemplate(1, "Vorlage A", [1, 2])]);
    fixture.overlay.onTemplateClick(1);

    fixture.overlay.toggleCourse(2);

    expect(fixture.overlay.draft.value?.courseIds).toEqual([1]);
    expect(fixture.overlay.isDirty.value).toBe(true);
  });

  it("öffnet eine Vorlage mit nicht mehr vorhandener Veranstaltung und erhält die ID", () => {
    const fixture = createFixture();
    fixture.templates.push({ id: 1, name: "Vorlage A", courses: [fakeCourse(4)] });

    fixture.overlay.onTemplateClick(1);

    expect(fixture.overlay.panel.value).toEqual({ mode: "edit", templateId: 1 });
    expect(fixture.overlay.draft.value?.courseIds).toEqual([4]);
  });
});
