import type { Course } from "./Course";

export type StudyGroupTemplate = {
  id: number;
  name: string;
  courses: Course[];
};
