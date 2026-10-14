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
import { mapTemplateUpdatesToApi } from "@/api/util";

export const useTemplateStore = defineStore("templates", () => {
  const templateMap = ref<Map<number, StudyGroupTemplate>>(new Map<number, StudyGroupTemplate>());
  const templateList = computed(() => Array.from(templateMap.value.values()));
  const selectedTemplateId = ref<number | null>(null);

  const { handleError, showError, showSuccess } = useNotification();

  /**
   * Erstellt ein neues Template und fügt es der Template-Map hinzu
   *
   * @param data - Benötigt ein Template-Objekt ohne ID
   */
  async function createTemplate(data: Omit<StudyGroupTemplate, "id">) {
    const { name, courses } = data;

    try {
      const template: StudyGroupTemplateApiData | undefined =
        await createStudyGroupTemplateApi(name);

      if (template === undefined) {
        throw Error;
      }

      for (const course of courses ?? []) {
        await assignCourseToStudyGroupTemplateApi(template.id, course.id);
      }

      showSuccess("Template erfolgreich erstellt!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Erstellen eines Templates.");
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
   */
  async function updateTemplate(id: number, updates: Partial<Omit<StudyGroupTemplate, "id">>) {
    try {
      const template = templateMap.value.get(id);
      if (!template) throw Error("Template nicht gefunden.");

      const apiUpdates = mapTemplateUpdatesToApi(updates);

      const apiTemplate = await updateStudyGroupTemplateApi(id, apiUpdates);

      if (apiTemplate === undefined) {
        throw Error;
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

      showSuccess("Template erfolgreich aktualisiert!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Aktualisieren eines Templates.");
    }
  }

  /**
   * Löscht ein Studiengruppen-Template
   *
   * @param id - Die ID des zu löschenden Templates
   */
  async function deleteTemplate(id: number) {
    try {
      const template = templateMap.value.get(id);

      if (template === undefined) {
        throw new Error("Template konnte nicht gefunden werden.");
      }

      const courses = [...template.courses];

      if (courses.length !== 0) {
        for (const c of courses) {
          await removeCourseFromStudyGroupTemplateApi(template.id, c.id);
        }
      }

      await deleteStudyGroupTemplateApi(id);
      showSuccess("Template erfolgreich gelöscht!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Löschen eines Templates!");
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
