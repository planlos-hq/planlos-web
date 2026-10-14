import type { ListItem } from "@/components/SideBar.vue";
import type { Course } from "./Course";
import type { Lecturer } from "./Lecturer";
import type { StudyGroup } from "./StudyGroup";
import type { DegreeProgram } from "./DegreeProgram";
import type { Room } from "./Room";

export function isCourse(item: ListItem): item is Course {
  return "sws" in item;
}
export function isLecturer(item: ListItem): item is Lecturer {
  return "firstName" in item && "lastName" in item;
}
export function isStudyGroup(item: ListItem): item is StudyGroup {
  return "degreeProgram" in item && "semesterYear" in item && "semesterSeason" in item;
}
export function isDegreeProgram(item: ListItem): item is DegreeProgram {
  return "name" in item && "abbreviation" in item && !("sws" in item) && !("semesterYear" in item);
}
export function isRoom(item: ListItem): item is Room {
  return "number" in item && "name" in item && !("sws" in item);
}
