import type {
  CourseApiData,
  CourseColorAssignment,
  CourseLecturerAssignment,
  CourseStudygroupAssignment,
  DegreeProgramApiData,
  LecturerApiData,
  RoomApiData,
  StudyGroupApiData,
  StudyGroupTemplateApiData,
  TemplateCourseAssignment,
  TimeSlotApiData,
  TimeSlotRoomAssignment,
} from "@/api/types";
import type { Color } from "@/models/Color";

export type UpdateOperation = "update" | "create" | "delete";

export type TimeSlotUpdateData = {
  resource: "courseTimeSlot";
  operation: UpdateOperation;
  data: TimeSlotApiData | number;
};

export type LecturerUpdateData = {
  resource: "lecturer";
  operation: UpdateOperation;
  data: LecturerApiData | number;
};
export type RoomUpdateData = {
  resource: "room";
  operation: UpdateOperation;
  data: RoomApiData | number;
};
export type DegreeProgramUpdateData = {
  resource: "degreeProgram";
  operation: UpdateOperation;
  data: DegreeProgramApiData | number;
};

export type StudyGroupUpdateData = {
  resource: "studyGroup";
  operation: UpdateOperation;
  data: StudyGroupApiData | number;
};
export type ColorUpdateData = {
  resource: "courseColor";
  operation: UpdateOperation;
  data: Color | number;
};

export type CourseUpdateData = {
  resource: "course";
  operation: UpdateOperation;
  data: CourseApiData | number;
};

export type CourseLecturerUpdateData = {
  resource: "courseLecturer";
  operation: UpdateOperation;
  data: CourseLecturerAssignment;
};

export type CourseStudyGroupUpdateData = {
  resource: "courseStudyGroup";
  operation: UpdateOperation;
  data: CourseStudygroupAssignment;
};
export type TimeSlotRoomUpdateData = {
  resource: "timeSlotRoomAssignment";
  operation: UpdateOperation;
  data: TimeSlotRoomAssignment;
};

export type CourseColorUpdateData = {
  resource: "courseColorAssignment";
  operation: UpdateOperation;
  data: CourseColorAssignment;
};

export type StudyGroupTemplateUpdateData = {
  resource: "studyGroupTemplate";
  operation: UpdateOperation;
  data: StudyGroupTemplateApiData;
};

export type StudyGroupTemplateCourseUpdateData = {
  resource: "studyGroupTemplateCourse";
  operation: UpdateOperation;
  data: TemplateCourseAssignment;
};

export type UpdateData =
  | TimeSlotUpdateData
  | TimeSlotRoomUpdateData
  | LecturerUpdateData
  | RoomUpdateData
  | DegreeProgramUpdateData
  | StudyGroupUpdateData
  | ColorUpdateData
  | CourseUpdateData
  | CourseLecturerUpdateData
  | CourseStudyGroupUpdateData
  | CourseColorUpdateData
  | StudyGroupTemplateUpdateData
  | StudyGroupTemplateCourseUpdateData;
