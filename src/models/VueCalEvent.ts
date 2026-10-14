import type { ResourceConflict } from "./ResourceConflict";

export type VueCalEvent = {
  id: string;
  timeSlotId: number;
  courseId: number;
  start: Date;
  end: Date;
  title: string;
  backgroundColor?: string;
  schedule?: number;
  conflicts: ResourceConflict[];
};
