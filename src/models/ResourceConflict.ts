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

export type ResourceConflictDisplay = {
  id: string;
  courseA: string;
  courseB: string;
  resourceType: ResourceType;
  resourceId: number;
  resourceLabel: string;
  resource: string;
  time: string;
  active: boolean;
};
