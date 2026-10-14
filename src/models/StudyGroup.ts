import { SemesterSeason } from "@/enums/enums";
import type { DegreeProgram } from "@/models/DegreeProgram";

export type StudyGroup = {
  id: number;
  semesterSeason: SemesterSeason;
  semesterYear: number;
  studentCount: number;
  degreeProgram: DegreeProgram;
  extraData?: Record<string, string>;
};
