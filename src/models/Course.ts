import type { Color } from "./Color";
import type { Lecturer } from "./Lecturer";
import type { StudyGroup } from "./StudyGroup";
import type { TimeSlot } from "./TimeSlot";

export type Course = {
  id: number;
  number: string;
  name: string;
  abbreviation: string;
  sws: number;
  creditPoints: number;
  lecturers: Lecturer[];
  studyGroups: StudyGroup[];
  color?: Color;
  timeSlots: TimeSlot[];
  extraData?: Record<string, string>;
};
