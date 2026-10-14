import type {
  CourseApiData,
  CourseColorAssignment,
  CourseLecturerAssignment,
  CourseStudygroupAssignment,
} from "@/api/types";
import type { UpdateOperation } from "./types.updates";
import { useCourseStore } from "@/stores/courseStore";
import { mapApiCourse } from "@/api/util";
import { useLecturerStore } from "@/stores/lecturerStore";
import { useStudyGroupStore } from "@/stores/studyGroupStore";
import { useColorStore } from "@/stores/colorStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function handleCourse(operation: UpdateOperation, data: CourseApiData | number) {
  const courseStore = useCourseStore();
  const settingsStore = useSettingsStore();
  let c;
  let mappedC;
  switch (operation) {
    case "create":
      c = data as CourseApiData;
      const existingC = courseStore.courseMap.get(c.id);
      if (existingC) {
        return;
      }
      //Dozenten und Studiengruppen werden über "courseLecturer" und "courseStudyGroup" zugewiesen
      mappedC = mapApiCourse(c, [], []);
      courseStore.courseMap.set(mappedC.id, mappedC);
      break;
    case "update":
      c = data as CourseApiData;
      const oldCourse = courseStore.courseMap.get(c.id);
      if (!oldCourse) {
        return;
      }
      oldCourse.number = c.number;
      oldCourse.name = c.name;
      oldCourse.abbreviation = c.abbreviation;
      oldCourse.sws = c.sws;
      oldCourse.creditPoints = c.credit_points;
      oldCourse.extraData = c.extra_data;
      break;
    case "delete":
      c = data as number;
      courseStore.courseMap.delete(c);
      settingsStore.removeOldDataFromLocalStorageState();
      settingsStore.removeOldDataFromQueryParameters();
      break;
  }
}

//Zuweisung der Dozenten zum Kurs
export function handleCourseLecturer(operation: UpdateOperation, data: CourseLecturerAssignment) {
  const courseStore = useCourseStore();
  const lecturerStore = useLecturerStore();
  const l = lecturerStore.lecturerMap.get(data.lecturer);
  const c = courseStore.courseMap.get(data.course);

  if (!l || !c) {
    return;
  }
  const index = c.lecturers.findIndex(lecturer => lecturer.id === l.id);

  switch (operation) {
    case "create":
      if (index !== -1) {
        return;
      }
      c.lecturers.push(l);
      break;
    case "delete":
      if (index === -1) {
        return;
      }
      c.lecturers.splice(index, 1);
      break;
  }
}

//Zuweisung der StudyGroups zum Kurs
export function handleCourseStudyGroup(
  operation: UpdateOperation,
  data: CourseStudygroupAssignment
) {
  const courseStore = useCourseStore();
  const studyGroupStore = useStudyGroupStore();
  const s = studyGroupStore.studyGroupMap.get(data.study_group);
  const c = courseStore.courseMap.get(data.course);

  if (!s || !c) {
    return;
  }
  const index = c.studyGroups.findIndex(studyGroup => studyGroup.id === s.id);
  switch (operation) {
    case "create":
      if (index !== -1) {
        return;
      }
      c.studyGroups.push(s);

      break;
    case "delete":
      if (index === -1) {
        return;
      }
      c.studyGroups.splice(index, 1);

      break;
  }
}

//Zuweisung der StudyGroups zum Kurs
export function handleCourseColor(operation: UpdateOperation, data: CourseColorAssignment) {
  const courseStore = useCourseStore();
  const colorStore = useColorStore();
  const color = colorStore.colorMap.get(data.color);
  const course = courseStore.courseMap.get(data.course);

  if (!color || !course) {
    return;
  }

  switch (operation) {
    case "create":
      course.color = color;
      break;
    case "delete":
      course.color = undefined;
      break;
  }
}
