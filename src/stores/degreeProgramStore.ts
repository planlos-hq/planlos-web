import {
  createDegreeProgramApi,
  deleteDegreeProgramApi,
  updateDegreeProgramApi,
} from "@/api/degreeProgram";
import { mapDegreeProgramUpdatesToApi } from "@/api/util";
import { useNotification } from "@/composables/useNotification";
import type { DegreeProgram } from "@/models/DegreeProgram";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

/**
 * Pinia Store für die Verwaltung von Studiengängen
 *
 * @returns Ein Objekt mit:
 * - degreeProgramList: Reaktive Liste aller Studiengänge
 * - createDegreeProgram: Funktion zum Erstellen eines neuen Studiengangs
 * - readDegreeProgram: Funktion zum Abrufen eines Studiengangs per ID
 * - updateDegreeProgram: Funktion zum Aktualisieren eines Studiengangs
 * - deleteDegreeProgram: Funktion zum Löschen eines Studiengangs
 */
export const useDegreeProgramStore = defineStore("degreePrograms", () => {
  const degreeProgramMap = ref<Map<number, DegreeProgram>>(new Map<number, DegreeProgram>());
  const degreeProgramList = computed(() => Array.from(degreeProgramMap.value.values()));
  const selectedDegreeProgramId = ref<number | null>(null);
  const { showError, showSuccess, handleError } = useNotification();

  /**
   * Erstellt einen neuen Studiengang und fügt diesen zur Studiengangsliste hinzu
   *
   * @param name - Name des Studiengangs
   * @param abbreviation - Kürzel des Studiengangs
   */
  async function createDegreeProgram(data: Omit<DegreeProgram, "id">) {
    const { name, abbreviation, extraData } = data;
    try {
      await createDegreeProgramApi(name, abbreviation, extraData);

      showSuccess("Studiengang erfolgreich hinzugefügt!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Erstellen eines Studiengangs.");
    }
  }

  /**
   * Sucht einen Studiengang anhand seiner ID
   *
   * @param id - Die eindeutige ID des Studiengangs
   * @returns Der gefundene Studiengang oder undefined, falls nicht vorhanden
   */
  function readDegreeProgram(id: number): DegreeProgram | undefined {
    const degreeProgram = degreeProgramMap.value.get(id);
    if (!degreeProgram) {
      showError("Fehler", "Der Studiengang konnte nicht gefunden werden.");
    }
    return degreeProgram;
  }

  /**
   * Aktualisiert einen existierenden Studiengang mit neuen Werten
   *
   * @param id - ID des zu aktualisierenden Studiengangs
   * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
   *
   * @example
   * ```
   * updateDegreeProgram(12345, { name: "Informatik", abbreviation: "INF" });
   * ```
   */
  async function updateDegreeProgram(id: number, updates: Partial<Omit<DegreeProgram, "id">>) {
    const degreeProgram = degreeProgramMap.value.get(id);
    if (degreeProgram) {
      try {
        const apiUpdates = mapDegreeProgramUpdatesToApi(updates);
        await updateDegreeProgramApi(id, apiUpdates);
        showSuccess("Studiengang erfolgreich aktualisiert.");
      } catch (error) {
        const e = error as Error;
        handleError(e, "Fehler beim Aktualisieren des Studiengangs.");
      }
    }
  }

  /**
   * Löscht einen Studiengang aus der Studiengangsliste
   *
   * @param id - Die eindeutige ID des zu löschenden Studiengangs
   */
  async function deleteDegreeProgram(id: number) {
    try {
      await deleteDegreeProgramApi(id);
      selectedDegreeProgramId.value = null;
      showSuccess("Studiengang erfolgreich gelöscht.");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Löschen des Studiengangs.");
    }
  }

  /**
   * Ermittelt den gewählte Studiengang.
   *
   * @returns ausgewählter Studiengang
   */
  const selectedDegreeProgram = computed(() => {
    const index = degreeProgramList.value.findIndex(
      degreeProgram => degreeProgram.id === selectedDegreeProgramId.value
    );
    return degreeProgramList.value[index];
  });

  /**
   * Dient der Auswahl eines Studiengangs.
   *
   * @param id - eindeutige ID des Studiengangs
   */
  function selectDegreeProgram(id: number | null) {
    selectedDegreeProgramId.value = id;
  }

  return {
    degreeProgramMap,
    degreeProgramList,
    createDegreeProgram,
    readDegreeProgram,
    updateDegreeProgram,
    deleteDegreeProgram,
    selectedDegreeProgram,
    selectDegreeProgram,
    selectedDegreeProgramId,
  };
});
