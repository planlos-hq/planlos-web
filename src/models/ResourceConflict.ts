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
