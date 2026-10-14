import type { LecturerKind } from "@/enums/enums";

export type Lecturer = {
  id: number;
  firstName: string;
  lastName: string;
  abbreviation: string;
  notes: string;
  kind: LecturerKind;
  isRelevant: boolean;
  extraData?: Record<string, string>;
};
