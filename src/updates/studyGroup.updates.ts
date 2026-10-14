import type { StudyGroupApiData } from "@/api/types";
import type { UpdateOperation } from "./types.updates";
import { mapApiStudyGroup } from "@/api/util";
import { useStudyGroupStore } from "@/stores/studyGroupStore";
import { useDegreeProgramStore } from "@/stores/degreeProgramStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function handleStudyGroup(operation: UpdateOperation, data: StudyGroupApiData | number) {
  const studyGroupStore = useStudyGroupStore();
  const degreeProgramStore = useDegreeProgramStore();
  const settingsStore = useSettingsStore();
  let s: StudyGroupApiData | number;
  switch (operation) {
    case "create":
      s = data as StudyGroupApiData;
      const existingS = studyGroupStore.studyGroupMap.get(s.id);
      if (existingS) {
        return;
      }
      studyGroupStore.studyGroupMap.set(
        s.id,
        mapApiStudyGroup(s, degreeProgramStore.readDegreeProgram)
      );
      break;
    case "update":
      s = data as StudyGroupApiData;
      const oldStudygroup = studyGroupStore.studyGroupMap.get(s.id);

      if (!oldStudygroup) {
        return;
      }
      const newStudygroup = mapApiStudyGroup(s, degreeProgramStore.readDegreeProgram);

      Object.assign(oldStudygroup, newStudygroup);
      break;
    case "delete":
      s = data as number;
      studyGroupStore.studyGroupMap.delete(s);
      settingsStore.removeOldDataFromLocalStorageState();
      settingsStore.removeOldDataFromQueryParameters();
      break;
  }
}
