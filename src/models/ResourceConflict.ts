export type ResourceType = "room" | "lecturer" | "study_group";

export type ResourceConflict = {
  resourceType: ResourceType;
  resourceId: number;
  weekday: number;
  slotA: number;
  slotACourse: number;
  slotATime: string;
  slotADuration: string;
  slotB: number;
  slotBCourse: number;
  slotBTime: string;
  slotBDuration: string;
};

export type IgnoredResourceConflict = {
  slotA: number;
  slotB: number;
  resourceType: ResourceType;
  resourceId: number;
};

/** Veranstaltung, der nur Laboringenieure zugewiesen sind */
export type CourseLecturerViolation = {
  courseId: number;
  number: string;
  name: string;
  labEngineerCount: number;
};

/** Termin, der in einer nicht verfügbaren Zeit seiner Lehrperson liegt */
export type LecturerTimeViolation = {
  constraintId: number;
  timeSlotId: number;
  lecturerId: number;
  courseId: number;
  /** true: Zeit möglichst meiden, false: nicht verfügbar */
  soft: boolean;
};

export type ResourceConflictDisplay = {
  id: string;
  courseA: string;
  courseB: string;
  slotA: number;
  slotB: number;
  resourceType: ResourceType;
  resourceId: number;
  resource: string;
  time: string;
  active: boolean;
};
