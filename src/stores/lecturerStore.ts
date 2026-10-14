import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Lecturer } from "@/models/Lecturer";
import { createLecturerApi, deleteLecturerApi, updateLecturerApi } from "@/api/lecturer";
import { mapLecturerUpdatesToApi } from "@/api/util";
import { useNotification } from "@/composables/useNotification";

/**
 * Pinia Store für die Verwaltung von Dozenten
 *
 * @returns Ein Objekt mit:
 * - lecturerList: Reaktive Liste aller Dozenten
 * - selectedLecturerId: Id des (in der Verwaltungsansicht) ausgewählten Dozenten
 * - selectedLecturer: Ermittelt den gewählten Dozenten anhand der selectedLecturerId
 * - createLecturer: Funktion zum Erstellen eines neuen Dozenten
 * - readLecturer: Funktio zum Abrufen eines Dozenten per ID
 * - updateLecturer: Funktion zum Aktualisieren eines Dozenten
 * - deleteLecturer: Funktion zum Löschen eines Dozenten
 * - selectLecturer: Funktion zum Setzen der selectedLecturerId
 */
export const useLecturerStore = defineStore("lecturers", () => {
  const lecturerMap = ref<Map<number, Lecturer>>(new Map<number, Lecturer>());
  const lecturerList = computed(() => {
    return Array.from(lecturerMap.value.values());
  });
  const relevantLecturers = computed(() => {
    const lecturers = [];
    for (const l of lecturerMap.value.values()) {
      if (l.isRelevant) {
        lecturers.push(l);
      }
    }
    return lecturers;
  });
  const selectedLecturerId = ref<number | null>(null);
  const { showSuccess, handleError, showError } = useNotification();

  /**
   * Erstellt einen neuen Dozenten und fügt ihn zur Dozentenliste hinzu
   *
   * @param data - Nimmt ein Lecturer-Objekt ohne die ID entgegen
   */
  async function createLecturer(data: Omit<Lecturer, "id">) {
    const { firstName, lastName, abbreviation, notes, kind, isRelevant, extraData } = data;

    try {
      await createLecturerApi(
        firstName,
        lastName,
        kind,
        abbreviation,
        notes,
        isRelevant ?? false,
        extraData
      );
      showSuccess("Dozent erfolgreich hinzugefügt!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Erstellen eines Dozenten.");
    }
  }

  /**
   * Sucht einen Dozenten anhand seiner ID
   *
   * @param id - Die eindeutige ID des Dozenten
   * @returns Der gefundene Dozent oder undefined, falls nicht vorhanden
   */
  function readLecturer(id: number): Lecturer | undefined {
    const lecturer = lecturerMap.value.get(id);
    if (!lecturer) {
      showError("Fehler", "Der Dozent konnte nicht gefunden werden.");
    }
    return lecturer;
  }

  /**
   * Aktualisiert einen existierenden Dozenten mit neuen Werten
   *
   * @param id - ID des zu aktualisierenden Dozenten
   * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
   *
   * @example
   * ```
   * updateLecturer(12345, { firstName: "Max", lastName: "Mustermann" });
   * ```
   */
  async function updateLecturer(id: number, updates: Partial<Omit<Lecturer, "id">>) {
    try {
      const apiUpdates = mapLecturerUpdatesToApi(updates);
      await updateLecturerApi(id, apiUpdates);

      showSuccess("Dozent erfolgreich aktualisiert!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Aktualisieren eines Dozenten.");
    }
  }

  /**
   * Löscht einen Dozenten aus der Dozentenmap
   *
   * @param id - Die ID des zu löschenden Dozenten
   */
  async function deleteLecturer(id: number) {
    try {
      await deleteLecturerApi(id);
      selectedLecturerId.value = null;
      showSuccess("Dozent erfolgreich gelöscht!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Löschen eines Dozenten.");
    }
  }

  /**
   * Dient der Auswahl eines Dozenten. Setzt dafür die selectedLecturerId.
   *
   * @param id - eindeutige ID des Dozenten
   */
  function selectLecturer(id: number | null) {
    selectedLecturerId.value = id;
  }

  /**
   * Ermittelt den gewählte Dozenten basierend auf der selectedLecturerId
   *
   * @returns ausgewählter Dozent
   */
  const selectedLecturer = computed(() => {
    if (selectedLecturerId.value === null) {
      return null;
    }
    return lecturerMap.value.get(selectedLecturerId.value);
  });

  return {
    lecturerMap,
    lecturerList,
    relevantLecturers,
    createLecturer,
    readLecturer,
    updateLecturer,
    deleteLecturer,
    selectLecturer,
    selectedLecturerId,
    selectedLecturer,
  };
});
