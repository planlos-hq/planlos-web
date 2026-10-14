import type { LecturerApiData } from "@/api/types";
import type { UpdateOperation } from "./types.updates";
import { useLecturerStore } from "@/stores/lecturerStore";
import { mapApiLecturer } from "@/api/util";
import { useSettingsStore } from "@/stores/settingsStore";

export function handleLecturer(operation: UpdateOperation, data: LecturerApiData | number) {
  const lecturerStore = useLecturerStore();
  const settingsStore = useSettingsStore();
  let l: LecturerApiData | number;
  switch (operation) {
    case "create":
      l = data as LecturerApiData;
      const existingL = lecturerStore.lecturerMap.get(l.id);
      if (existingL) {
        return;
      }
      lecturerStore.lecturerMap.set(l.id, mapApiLecturer(l));
      break;
    case "delete":
      l = data as number;
      lecturerStore.lecturerMap.delete(l);
      settingsStore.removeOldDataFromLocalStorageState();
      settingsStore.removeOldDataFromQueryParameters();
      break;
    case "update":
      l = data as LecturerApiData;
      const newLecturer = mapApiLecturer(l);
      const oldLecturer = lecturerStore.lecturerMap.get(l.id);
      if (!oldLecturer) {
        return;
      }
      Object.assign(oldLecturer, newLecturer);
      break;
  }
}
