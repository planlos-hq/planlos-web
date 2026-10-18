import type { ResourceConflict } from "./ResourceConflict";

export type VueCalEvent = {
  id: string;
  // Interne vue-cal-Daten. Wir setzen nur `id` beim Anlegen, den Rest ergänzt vue-cal.
  _?: { id: string };
  timeSlotId: number;
  courseId: number;
  start: Date;
  end: Date;
  title: string;
  backgroundColor?: string;
  // Spalte in Vue-Cal. Wird im Drop-Payload von vue-cal auf die Zielspalte überschrieben
  schedule?: number;
  // Ursprüngliche Studiengruppe/Spalte des Events, wird von vue-cal nicht angefasst
  studyGroupId?: number;
  conflicts: ResourceConflict[];
};
