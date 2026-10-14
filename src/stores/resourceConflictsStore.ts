import {
  getAllResourceConflictsApi,
  getConflictsForResourceApi,
  getIgnoredResourceConflictsApi,
  ignoreResourceConflictApi,
  unignoreResourceConflictApi,
} from "@/api/resourceConflicts";
import type {
  ResourceConflict,
  IgnoredResourceConflict,
  ResourceType,
} from "@/models/ResourceConflict";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useNotification } from "@/composables/useNotification";
import {
  mapApiIgnoredResourceConflict,
  mapApiResourceConflict,
  mapIgnoredResourceConflictToApi,
} from "@/api/util";
import { useLecturerStore } from "./lecturerStore";
import { useRoomStore } from "./roomStore";
import { useStudyGroupStore } from "./studyGroupStore";

export const useResourceConflictStore = defineStore("resourceConflicts", () => {
  const { showError, handleError } = useNotification();
  const lecturerStore = useLecturerStore();
  const roomStore = useRoomStore();
  const studyGroupStore = useStudyGroupStore();

  const resourceConflictsMap = ref<Map<string, ResourceConflict>>(
    new Map<string, ResourceConflict>()
  );
  const resourceConflictsList = computed(() => Array.from(resourceConflictsMap.value.values()));

  const ignoredResourceConflictsMap = ref<Map<string, IgnoredResourceConflict>>(
    new Map<string, IgnoredResourceConflict>()
  );
  const ignoredResourceConflictsList = computed(() =>
    Array.from(ignoredResourceConflictsMap.value.values())
  );

  const timeSlotConflictsMap = computed(() => {
    const map = new Map<number, ResourceConflict[]>();

    resourceConflictsList.value.forEach(c => {
      const timeSlotIds: number[] = [c.slotA, c.slotB];

      timeSlotIds.forEach(t => {
        const conflictList = map.get(t) ?? [];
        conflictList.push(c);
        map.set(t, conflictList);
      });
    });
    return map;
  });

  function getKey(conflict: {
    slotA: number;
    slotB: number;
    resourceType: ResourceType;
    resourceId: number;
  }) {
    return `${conflict.resourceType}-${conflict.resourceId}-${conflict.slotA}-${conflict.slotB}`;
  }

  /**
   * Sucht einen Konflikt anhand des Keys
   *
   * @param id - Der eindeutige Key des Kurses
   * @returns Der gefundene Konflikt oder undefined, falls nicht vorhanden
   */
  function readResourceConflict(id: string): ResourceConflict | undefined {
    const conflict = resourceConflictsMap.value.get(id);
    if (conflict === undefined) {
      showError("Fehler", "Konflikt konnte nicht gefunden werden.");
    }
    return conflict;
  }

  /**
   * Sucht einen ignorierten Konflikt anhand des Keys
   *
   * @param id - Der eindeutige Key des ingorierten Kurses
   * @returns Der gefundene ignorierte Konflikt oder undefined, falls nicht vorhanden
   */
  function readIgnoredResourceConflict(id: string): IgnoredResourceConflict | undefined {
    const conflict = ignoredResourceConflictsMap.value.get(id);
    if (conflict === undefined) {
      showError("Fehler", "Konflikt konnte nicht gefunden werden.");
    }
    return conflict;
  }

  /**
   * Lädt alle Ressourcenkonflikte in den Store
   */
  async function loadResourceConflicts() {
    const apiConflicts = await getAllResourceConflictsApi();
    if (apiConflicts === undefined) {
      showError("Fehler", "Ressourcenkonflikte konnten nicht geladen werden");
      return;
    }

    const newConflicts = apiConflicts.map(c => mapApiResourceConflict(c));
    updateResourceConflicts(newConflicts);
  }

  function updateResourceConflicts(newConflicts: ResourceConflict[]) {
    const newMap = new Map<string, ResourceConflict>();

    for (const conflict of newConflicts) {
      const key = getKey(conflict);
      newMap.set(key, conflict);

      const existing = resourceConflictsMap.value.get(key);
      // Neuen Konflikt hinzufügen
      if (!existing) {
        resourceConflictsMap.value.set(key, conflict);
        continue;
      }
      // Bereits existierende Konflikte updaten, wenn Änderungen vorliegen
      if (JSON.stringify(existing) !== JSON.stringify(conflict)) {
        Object.assign(existing, conflict);
      }
    }

    //entferne alte Konflikte
    for (const key of resourceConflictsMap.value.keys()) {
      if (!newMap.has(key)) {
        resourceConflictsMap.value.delete(key);
      }
    }
  }

  /**
   * Lädt alle ignorierten Ressourcenkonflikte in den Store
   */
  async function loadIgnoredResourceConflicts() {
    const apiIgnoredConflicts = await getIgnoredResourceConflictsApi();
    if (apiIgnoredConflicts === undefined) {
      showError("Fehler", "Ignorierte Ressourcenkonflikte konnten nicht geladen werden");
      return;
    }

    const newIgnoredConflicts = apiIgnoredConflicts.map(c => mapApiIgnoredResourceConflict(c));
    updateIgnoredResourceConflicts(newIgnoredConflicts);
  }

  function updateIgnoredResourceConflicts(newConflicts: IgnoredResourceConflict[]) {
    const newMap = new Map<string, IgnoredResourceConflict>();

    for (const conflict of newConflicts) {
      const key = getKey(conflict);
      newMap.set(key, conflict);

      const existing = ignoredResourceConflictsMap.value.get(key);
      // Neuen Konflikt hinzufügen
      if (!existing) {
        ignoredResourceConflictsMap.value.set(key, conflict);
        continue;
      }
      // Bereits existierende Konflikte updaten, wenn Änderungen vorliegen
      if (JSON.stringify(existing) !== JSON.stringify(conflict)) {
        Object.assign(existing, conflict);
      }
    }

    //entferne alte Konflikte
    for (const key of ignoredResourceConflictsMap.value.keys()) {
      if (!newMap.has(key)) {
        ignoredResourceConflictsMap.value.delete(key);
      }
    }
  }

  /**
   * Fügt einen Ressourcenkonflikt der entsprechenden Map hinzu.
   *
   * @param conflict - Ressourcenkonflikt
   */
  async function addResourceConflictToMap(conflict: ResourceConflict) {
    resourceConflictsMap.value.set(getKey(conflict), conflict);
  }

  /**
   * Fügt einen ignorierten Ressourcenkonflikt der entsprechenden Map hinzu.
   *
   * @param ignoredConflict - Ressourcenkonflikt, der als ignoriert markiert ist
   */
  async function addIgnoredResourceConflictToMap(ignoredConflict: IgnoredResourceConflict) {
    ignoredResourceConflictsMap.value.set(getKey(ignoredConflict), ignoredConflict);
  }

  /**
   * Löscht den angegeben Konflikt aus der Map
   *
   * @param conflict - der zu löschende Konflikt
   */
  function removeResourceConflictFromMap(conflict: ResourceConflict) {
    resourceConflictsMap.value.delete(getKey(conflict));
  }

  /**
   * Löscht den angegeben ignorierten Konflikt aus der Map
   *
   * @param ignoredConflict - der zu löschende ignorierte Konflikt
   */
  function removeIgnoredResourceConflictFromMap(ignoredConflict: IgnoredResourceConflict) {
    ignoredResourceConflictsMap.value.delete(getKey(ignoredConflict));
  }

  /**
   * Mapt ein Objekt des Typs "ResourceConflict" zum Typ "IgnoredResourceConflict"
   *
   * @param conflict - Objekt des Typs "ResourceConflict"
   * @returns Objekt des Typs "IgnoredResourceConflict"
   */
  function mapResourceConflictToIgnored(conflict: ResourceConflict): IgnoredResourceConflict {
    const ignoredConflict: IgnoredResourceConflict = {
      slotA: conflict.slotA,
      slotB: conflict.slotB,
      resourceType: conflict.resourceType,
      resourceId: conflict.resourceId,
    };
    return ignoredConflict;
  }

  /**
   * Nimmt ein Objekt des Typs "ResourceConflict" entgegen und entfernt es aus der zugehörigen Map.
   * Mapt das Objekt dann zu einem "IgnoredResourceConflict" und fügt es der entsprechenden Map hinzu.
   *
   * @param conflict - Objekt des Typs "ResourceConflict"
   */
  function changeResourceConflictToIgnored(conflict: ResourceConflict) {
    const ignoredConflict = mapResourceConflictToIgnored(conflict);
    removeResourceConflictFromMap(conflict);
    addIgnoredResourceConflictToMap(ignoredConflict);
  }

  /**
   * Markiert einen Konflikt persitent als ignoriert.
   *
   * @param conflict - Ressourcenkonflikt
   */
  async function ignoreConflict(id: string) {
    const conflict = readResourceConflict(id);
    if (conflict === undefined) return;
    try {
      await ignoreResourceConflictApi(
        conflict.slotA,
        conflict.slotB,
        conflict.resourceType,
        conflict.resourceId
      );

      changeResourceConflictToIgnored(conflict);
    } catch (error) {
      const e = error as Error;
      handleError(e, "Ein Fehler ist bei der Bearbeitung des Konflikts aufgetreten.");
    }
  }

  /**
   * Hebt die Markierung einer Veranstaltung als "ignoriert" persistent wieder auf.
   *
   * @param ignoredConflict - ignorierter Ressourcenkonflikt
   */
  async function unignoreConflict(id: string) {
    const ignoredConflict: IgnoredResourceConflict | undefined = readIgnoredResourceConflict(id);
    if (ignoredConflict === undefined) return;
    try {
      const apiIgnoredConflict = mapIgnoredResourceConflictToApi(ignoredConflict);
      await unignoreResourceConflictApi(apiIgnoredConflict);

      const conflict = await fetchSpecificResourceConflict(
        ignoredConflict.slotA,
        ignoredConflict.slotB,
        ignoredConflict.resourceType,
        ignoredConflict.resourceId
      );

      if (conflict !== undefined) addResourceConflictToMap(conflict);

      removeIgnoredResourceConflictFromMap(ignoredConflict);
    } catch (error) {
      const e = error as Error;
      handleError(e, "Ein Fehler ist bei der Bearbeitung des Konflikts aufgetreten.");
    }
  }

  /**
   * Diese Funktion fetch eine Liste von Ressourcenkonflikte, die eine spezifische Ressource betreffen.
   * Aus dieser Liste wird dann anhand der slotIds der gesuchte Konflikte gefiltert.
   *
   * @param slotA - Id des ersten betroffenen Zeitslot
   * @param slotB - Id des zweiten betroffenen Zeitslot
   * @param resourceType - Art der Ressource (Dozent, Raum, ...)
   * @param resourceId - Konkrete Id der Ressource
   * @returns den gesuchten Konflikt
   */
  async function fetchSpecificResourceConflict(
    slotA: number,
    slotB: number,
    resourceType: ResourceType,
    resourceId: number
  ) {
    try {
      const resourceConflicts = await getConflictsForResourceApi(resourceType, resourceId);

      if (resourceConflicts === undefined) {
        showError("Fehler", "Fehler beim Laden des Konflikts");
        return;
      }

      const conflict = resourceConflicts
        .map(c => mapApiResourceConflict(c))
        .find(c => c.slotA === slotA && c.slotB === slotB);

      if (conflict === undefined) {
        showError("Fehler", "Konflikt konnte nicht gefunden werden");
        return;
      }

      return conflict;
    } catch (error) {
      const e = error as Error;
      handleError(e, "Konflikt konnte nicht gefunden werden.");
    }
  }

  /**
   * Hilfsfunktion zur Umwandlung des Ressourcentyps zu einem deutschsprachigen String
   *
   * @param resourceType - Art der Ressource
   * @returns deutschsprachige Bezeichnung des Ressourcentyps
   */
  function getResourceTypeString(resourceType: ResourceType): string {
    switch (resourceType) {
      case "lecturer":
        return "Lehrperson";
      case "room":
        return "Raum";
      case "study_group":
        return "Semestergruppe";
      default:
        return "Ressource";
    }
  }

  /**
   *
   * @param resourceType - Art der Ressource
   * @param resourceId - Konkrete Id der Ressource
   * @returns die Bezeichnung der Ressource
   */
  function getResourceDisplayString(resourceType: ResourceType, resourceId: number): string {
    switch (resourceType) {
      case "lecturer": {
        const lecturer = lecturerStore.readLecturer(resourceId);
        if (lecturer === undefined) return "-";
        return `${lecturer.firstName} ${lecturer.lastName}`;
      }

      case "room": {
        const room = roomStore.readRoom(resourceId);
        if (room === undefined) return "-";
        return `${room.number}: ${room.name}`;
      }
      case "study_group": {
        const group = studyGroupStore.readStudyGroup(resourceId);
        if (group === undefined) return "-";
        return `${group.degreeProgram.abbreviation} ${group.semesterYear % 100}_${group.semesterSeason.charAt(0).toUpperCase()}`;
      }
      default:
        return "-";
    }
  }

  return {
    resourceConflictsList,
    ignoredResourceConflictsList,
    timeSlotConflictsMap,
    getKey,
    loadResourceConflicts,
    loadIgnoredResourceConflicts,
    ignoreConflict,
    unignoreConflict,
    addResourceConflictToMap,
    addIgnoredResourceConflictToMap,
    getResourceTypeString,
    getResourceDisplayString,
  };
});
