import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useNotification } from "@/composables/useNotification";
import type { StudyGroupTemplate } from "@/models/StudyGroupTemplate";
import {
  assignCourseToStudyGroupTemplateApi,
  createStudyGroupTemplateApi,
  deleteStudyGroupTemplateApi,
  removeCourseFromStudyGroupTemplateApi,
  updateStudyGroupTemplateApi,
} from "@/api/studyGroupTemplate";
import type { StudyGroupTemplateApiData } from "@/api/types";
import { mapApiTemplate, mapTemplateUpdatesToApi } from "@/api/util";

export const useTemplateStore = defineStore("templates", () => {
  const templateMap = ref<Map<number, StudyGroupTemplate>>(new Map<number, StudyGroupTemplate>());
  const templateList = computed(() => Array.from(templateMap.value.values()));
  const selectedTemplateId = ref<number | null>(null);

  const { handleError, showError, showSuccess } = useNotification();

  /**
   * Erstellt ein neues Template und fügt es der Template-Map hinzu
   *
   * @param data - Benötigt ein Template-Objekt ohne ID
   * @returns das created Template oder undefined, wenn das Erstellen fehlgeschlagen ist
   */
  async function createTemplate(
    data: Omit<StudyGroupTemplate, "id">
  ): Promise<StudyGroupTemplate | undefined> {
    const { name, courses } = data;

    try {
      const template: StudyGroupTemplateApiData | undefined =
        await createStudyGroupTemplateApi(name);

      if (template === undefined) {
        throw new Error("Template konnte nicht erstellt werden.");
      }

      // Vorlage bereits eintragen, damit sie nicht erst über das Live-Update in der Liste auftaucht.
      // Live-Updates überschreiben den Eintrag nicht.
      if (!templateMap.value.has(template.id)) {
        templateMap.value.set(template.id, mapApiTemplate(template, []));
      }

      for (const course of courses ?? []) {
        await assignCourseToStudyGroupTemplateApi(template.id, course.id);
      }

      showSuccess("Template erfolgreich erstellt!");

      return templateMap.value.get(template.id);
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Erstellen eines Templates.");

      return undefined;
    }
  }

  /**
   * Sucht eine Template anhand seiner ID
   *
   * @param id - Die eindeutige ID des Templates
   * @returns Das gefundene Template oder undefined, falls nicht vorhanden
   */
  function readTemplate(id: number): StudyGroupTemplate | undefined {
    const template = templateMap.value.get(id);
    if (!template) {
      showError("Fehler", "Template konnte nicht gefunden werden.");
    }
    return template;
  }

  /**
   * Aktualisiert ein existierendes Template
   *
   * @param id - Die ID des zu aktualisierenden Templates
   * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
   * @returns true, wenn das Aktualisieren erfolgreich war
   */
  async function updateTemplate(
    id: number,
    updates: Partial<Omit<StudyGroupTemplate, "id">>
  ): Promise<boolean> {
    try {
      const template = templateMap.value.get(id);
      if (!template) throw Error("Template nicht gefunden.");

      const apiUpdates = mapTemplateUpdatesToApi(updates);

      const apiTemplate = await updateStudyGroupTemplateApi(id, apiUpdates);

      if (apiTemplate === undefined) {
        throw new Error("Template konnte nicht aktualisiert werden.");
      }

      if (updates.courses !== undefined) {
        const templateCourses = [...template.courses];
        const templateCoursesIds = templateCourses.map(c => c.id);
        const updateIds = updates.courses.map(c => c.id);

        for (const c of updates.courses) {
          if (templateCoursesIds.indexOf(c.id) === -1) {
            await assignCourseToStudyGroupTemplateApi(id, c.id);
          }
        }

        for (const c of templateCourses) {
          if (updateIds.indexOf(c.id) === -1) {
            await removeCourseFromStudyGroupTemplateApi(id, c.id);
          }
        }
      }

      if (updates.name !== undefined) {
        template.name = apiTemplate.name;
      }

      showSuccess("Template erfolgreich aktualisiert!");

      return true;
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Aktualisieren eines Templates.");

      return false;
    }
  }

  /**
   * Löscht ein Studiengruppen-Template
   *
   * @param id - Die ID des zu löschenden Templates
   * @returns true, wenn das Löschen erfolgreich war
   */
  async function deleteTemplate(id: number): Promise<boolean> {
    try {
      const template = templateMap.value.get(id);

      if (template === undefined) {
        throw new Error("Template konnte nicht gefunden werden.");
      }

      const courses = [...template.courses];

      for (const c of courses) {
        await removeCourseFromStudyGroupTemplateApi(template.id, c.id);
      }

      await deleteStudyGroupTemplateApi(id);

      templateMap.value.delete(id);

      if (selectedTemplateId.value === id) {
        selectedTemplateId.value = null;
      }

      showSuccess("Template erfolgreich gelöscht!");

      return true;
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Löschen eines Templates!");

      return false;
    }
  }

  /**
   * Dient der Auswahl eines Templates.
   *
   * @param id - eindeutige ID des Templates
   */
  function selectTemplate(id: number | null) {
    selectedTemplateId.value = id;
  }

  /**
   * Ermittelt das gewählte Template
   *
   * @returns ausgewählter Raum
   */
  const selectedTemplate = computed(() => {
    if (selectedTemplateId.value === null) return;
    return templateMap.value.get(selectedTemplateId.value);
  });

  return {
    createTemplate,
    readTemplate,
    updateTemplate,
    deleteTemplate,
    templateList,
    templateMap,
    selectTemplate,
    selectedTemplate,
    selectedTemplateId,
  };
});
