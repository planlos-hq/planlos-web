import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import type { StudyGroup } from "@/models/StudyGroup";
import { createStudyGroupApi, deleteStudyGroupApi, updateStudyGroupApi } from "@/api/studyGroup";
import type { StudyGroupApiData } from "@/api/types";
import { mapStudyGroupUpdatesToApi } from "@/api/util";
import { useNotification } from "@/composables/useNotification";
import { useCourseStore } from "./courseStore";
import { useSettingsStore } from "./settingsStore";
import { useDegreeProgramStore } from "./degreeProgramStore";

/**
 * Pinia Store für die Verwaltung von Studiengruppen
 *
 * @returns Ein Objekt mit:
 * - studyGroupList: Reaktive Liste aller Studiengruppen
 * - schedules: Stundenpläne der in den Einstellungen ausgewählten Studiengruppen
 * - degreeProgramSchedules: Stundenpläne aller Studiengruppen des ausgewählten Studiengangs
 * - studyGroupsByDegreeProgram: Funktion zum Ermitteln aller Studiengruppen eines Studiengangs
 * - selectedStudyGroupId: Id der (in der Verwaltungsansicht) ausgewählten Studiengruppe
 * - selectedStudyGroup: Ermittelt die gewählte Studiengruppe anhand der selectedStudyGroupId
 * - createStudyGroup: Funktion zum Erstellen einer neuen Studiengruppe
 * - readStudyGroup: Funktion zum Abrufen einer Studiengruppe per ID
 * - updateStudyGroup: Funktion zum Aktualisieren einer Studiengruppe
 * - deleteStudyGroup: Funktion zum Löschen einer Studiengruppe
 * - selectStudyGroup: Funktion zum Setzen der selectedStudyGroupId
 */
export const useStudyGroupStore = defineStore("studyGroups", () => {
  const studyGroupMap = ref<Map<number, StudyGroup>>(new Map<number, StudyGroup>());
  const studyGroupList = computed(() => Array.from(studyGroupMap.value.values()));
  const selectedStudyGroupId = ref<number | null>(null);
  const { showError, showSuccess, handleError } = useNotification();

  const settingsStore = useSettingsStore();
  const degreeProgramStore = useDegreeProgramStore();
  const { plannerSettings } = storeToRefs(settingsStore);

  /**
   * Erstellt eine neue Studiengruppe und fügt sie zur Studiengruppenliste hinzu
   *
   * @param data - Benötigt ein StudyGroup-Objekt ohne ID
   * @returns Die vom Backend zurückgelieferten API-Daten der neuen Gruppe oder undefined im Fehlerfall
   */
  async function createStudyGroup(
    data: Omit<StudyGroup, "id">
  ): Promise<StudyGroupApiData | undefined> {
    const { semesterSeason, semesterYear, studentCount, degreeProgram, extraData } = data;

    try {
      const apiGroup = await createStudyGroupApi(
        semesterSeason,
        semesterYear,
        studentCount ?? 0,
        degreeProgram.id,
        extraData
      );
      showSuccess("Studiengruppe erfolgreich hinzugefügt!");
      return apiGroup;
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Erstellen einer Studiengruppe.");
      return undefined;
    }
  }

  /**
   * Sucht eine Studiengruppe anhand ihrer ID
   *
   * @param id - eindeutige ID der Studiengruppe
   * @returns Die gefundene Studiengruppe oder undefined, falls nicht vorhanden
   */
  function readStudyGroup(id: number): StudyGroup | undefined {
    const studyGroup = studyGroupMap.value.get(id);
    if (!studyGroup) {
      showError("Fehler", "Die Studiengruppe konnte nicht gefunden werden!");
    }
    return studyGroup;
  }

  /**
   * Aktualisiert eine existierende Studiengruppe mit neuen Werten
   *
   * @param id - eindeutige ID der Studiengruppe
   * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
   *
   * @example updateStudyGroup(12345, \{ semesterYear: 2026, studentCount: 30 \});
   */
  async function updateStudyGroup(id: number, updates: Partial<Omit<StudyGroup, "id">>) {
    try {
      const apiUpdates = mapStudyGroupUpdatesToApi(updates);
      await updateStudyGroupApi(id, apiUpdates);
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Aktualisieren der Studiengruppe.");
    }
  }

  /**
   * Löscht eine Studiengruppe anhand ihrer ID
   *
   * @param id - eindeutige ID der Studiengruppe
   */
  async function deleteStudyGroup(id: number) {
    try {
      await deleteStudyGroupApi(id);
      selectedStudyGroupId.value = null;

      showSuccess("Studiengruppe erfolgreich gelöscht!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Löschen der Studiengruppe!");
    }
  }

  /**
   * Wandelt Studiengruppen in Stundenpläne (Schedules) für VueCal um
   *
   * @param groups - Studiengruppen, für die je ein Stundenplan erzeugt wird
   * @returns Eine Liste von Stundenplänen mit ID, Label und CSS-Klasse
   */
  function toSchedules(groups: StudyGroup[]) {
    return groups.map((group, index) => ({
      id: group.id,
      label: `${group.degreeProgram.abbreviation}${group.semesterYear % 100}_${group.semesterSeason.slice(0, 1).toUpperCase()}`,
      class: [`schedule-${index}`, highlightGroup(group) ? "highlight" : null]
        .filter(c => c !== null)
        .join(" "),
    }));
  }

  /**
   * Erstellt eine gefilterte Liste von Stundenplänen basierend auf ausgewählten Studiengruppen
   *
   * @returns Eine Liste von Stundenplänen mit ID, Label und CSS-Klasse
   */
  const schedules = computed(() => {
    const selectedStudyGroupList = [...plannerSettings.value.studyGroups]
      .map(id => studyGroupMap.value.get(id))
      .filter(s => s !== undefined);

    return toSchedules(selectedStudyGroupList);
  });

  /**
   * Ermittelt alle Studiengruppen eines Studiengangs, chronologisch sortiert
   *
   * @param degreeProgramId - eindeutige ID des Studiengangs
   * @returns Liste der Studiengruppen des Studiengangs
   */
  const studyGroupsByDegreeProgram = computed(
    () => (degreeProgramId: number) =>
      studyGroupList.value
        .filter(group => group.degreeProgram.id === degreeProgramId)
        .sort(
          (a, b) =>
            a.semesterYear - b.semesterYear || a.semesterSeason.localeCompare(b.semesterSeason)
        )
  );

  /**
   * Erstellt die Stundenpläne aller Studiengruppen des ausgewählten Studiengangs
   *
   * @returns Eine Liste von Stundenplänen mit ID, Label und CSS-Klasse
   */
  const degreeProgramSchedules = computed(() => {
    const degreeProgramId = degreeProgramStore.selectedDegreeProgramId;
    if (degreeProgramId === null) return [];
    return toSchedules(studyGroupsByDegreeProgram.value(degreeProgramId));
  });

  function highlightGroup(studyGroup: StudyGroup): boolean {
    const { readCourse, selectedCourseId } = useCourseStore();

    if (selectedCourseId === null) return false;
    const course = readCourse(selectedCourseId);
    if (course === undefined) return false;
    return course.studyGroups.includes(studyGroup);
  }

  /**
   * Dient der Auswahl einer Studiengruppe. Setzt dafür die selectedStudyGroupId.
   *
   * @param id - eindeutige ID einer Studiengruppe
   */
  function selectStudyGroup(id: number | null) {
    selectedStudyGroupId.value = id;
  }

  /**
   * Ermittelt die gewählte Studiengruppe basierend auf der selectedStudyGroupId
   *
   * @returns ausgewählte Studiengruppe
   */
  const selectedStudyGroup = computed(() => {
    const index = studyGroupList.value.findIndex(
      studyGroup => studyGroup.id === selectedStudyGroupId.value
    );
    return studyGroupList.value[index];
  });

  return {
    studyGroupMap,
    studyGroupList,
    schedules,
    degreeProgramSchedules,
    studyGroupsByDegreeProgram,
    selectedStudyGroupId,
    selectedStudyGroup,
    createStudyGroup,
    readStudyGroup,
    updateStudyGroup,
    deleteStudyGroup,
    selectStudyGroup,
  };
});
