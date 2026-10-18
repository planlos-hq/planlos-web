import { Tab } from "@/enums/enums";
import { useCourseStore } from "@/stores/courseStore";
import { useDegreeProgramStore } from "@/stores/degreeProgramStore";
import { useLecturerStore } from "@/stores/lecturerStore";
import { useRoomStore } from "@/stores/roomStore";
import { useStudyGroupStore } from "@/stores/studyGroupStore";
import { useViewStore } from "@/stores/viewStore";

/**
 * Entfernt IDs aus der Ansicht, deren Ressourcen es nicht mehr gibt (z. B. offline gelöscht).
 * Nur nach vollständigem Laden der Daten aufrufen, sonst werden mit leeren Stores alle IDs entfernt.
 */
export function pruneView() {
  const maps: Record<Tab, Map<number, unknown>> = {
    [Tab.COURSE]: useCourseStore().courseMap,
    [Tab.LECTURER]: useLecturerStore().lecturerMap,
    [Tab.STUDYGROUP]: useStudyGroupStore().studyGroupMap,
    [Tab.DEGREEPROGRAM]: useDegreeProgramStore().degreeProgramMap,
    [Tab.ROOM]: useRoomStore().roomMap,
  };
  return useViewStore().prune((tab, id) => maps[tab].has(id));
}
