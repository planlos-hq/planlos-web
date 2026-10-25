import type { LecturerKind } from "@/enums/enums";
import type { Color } from "@/models/Color";
import type { ResourceType } from "@/models/ResourceConflict";

export type CourseApiData = {
  id: number;
  number: string;
  name: string;
  sws: number;
  credit_points: number;
  abbreviation: string;
  extra_data: Record<string, string>;
};

export type StudyGroupApiData = {
  id: number;
  semester_season: "summer" | "winter";
  semester_year: number;
  student_count: number;
  degree_program: number;
  extra_data: Record<string, string>;
};

export type LecturerApiData = {
  id: number;
  first_name: string;
  last_name: string;
  abbreviation: string;
  kind: LecturerKind;
  notes: string;
  is_relevant: boolean;
  extra_data: Record<string, string>;
};

export type RoomApiData = {
  id: number;
  number: string;
  name: string;
  seats: number;
  extra_data: Record<string, string>;
};

export type DegreeProgramApiData = {
  id: number;
  name: string;
  abbreviation: string;
  extra_data: Record<string, string>;
};

export type CourseLecturerAssignment = {
  course: number;
  lecturer: number;
};

export type CourseStudygroupAssignment = {
  study_group: number;
  course: number;
};

export type CourseColorAssignment = {
  color: number;
  course: number;
};

export type TimeSlotApiData = {
  id: number;
  course: number;
  weekday: number;
  at: string;
  duration: string;
};

export type TimeSlotRoomAssignment = {
  room: number;
  time_slot: number;
};

export type LecturerNegativeTimeConstraint = {
  id: number;
  lecturer: number;
  weekday: number;
  at: string;
  duration: string;
  soft: boolean;
};

export type ResourceConflictApiData = {
  resource_type: ResourceType;
  resource_id: number;
  weekday: number;
  slot_a_id: number;
  slot_a_course: number;
  slot_a_at: string;
  slot_a_duration: string;
  slot_b_id: number;
  slot_b_course: number;
  slot_b_at: string;
  slot_b_duration: string;
};

export type CourseLecturerViolationApiData = {
  course_id: number;
  number: string;
  name: string;
  lab_engineer_count: number;
};

export type IgnoredResourceConflictApiData = {
  slot_a: number;
  slot_b: number;
  resource_type: ResourceType;
  resource_id: number;
};

export type StudyGroupTemplateApiData = {
  id: number;
  name: string;
};

export type TemplateCourseAssignment = {
  template: number;
  course: number;
};

export type GlobalApiData = {
  courses: CourseApiData[];
  rooms: RoomApiData[];
  time_slot_room_assignments: TimeSlotRoomAssignment[];
  degree_programs: DegreeProgramApiData[];
  lecturers: LecturerApiData[];
  course_lecturers: CourseLecturerAssignment[];
  course_time_slots: TimeSlotApiData[];
  course_colors: Color[];
  time_constraints: LecturerNegativeTimeConstraint[];
  study_groups: StudyGroupApiData[];
  study_group_templates: StudyGroupTemplateApiData[];
  study_group_template_courses: TemplateCourseAssignment[];
  course_color_assignments: CourseColorAssignment[];
  course_study_groups: CourseStudygroupAssignment[];
};
