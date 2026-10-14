import { SemesterSeason } from "@/enums/enums";
import type {
  CourseApiData,
  DegreeProgramApiData,
  IgnoredResourceConflictApiData,
  LecturerApiData,
  ResourceConflictApiData,
  RoomApiData,
  StudyGroupApiData,
  StudyGroupTemplateApiData,
  TimeSlotApiData,
} from "./types";
import type { Lecturer } from "@/models/Lecturer";
import type { StudyGroup } from "@/models/StudyGroup";
import type { DegreeProgram } from "@/models/DegreeProgram";
import { useDegreeProgramStore } from "@/stores/degreeProgramStore";
import type { Course } from "@/models/Course";
import type { TimeSlot } from "@/models/TimeSlot";
import { timetableConfig } from "@/timetableConfig";
import type { Color } from "@/models/Color";
import type { Room } from "@/models/Room";
import type { ResourceConflict, IgnoredResourceConflict } from "@/models/ResourceConflict";
import type { StudyGroupTemplate } from "@/models/StudyGroupTemplate";

export function mapApiSeason(season: "winter" | "summer"): SemesterSeason {
  switch (season) {
    case "summer":
      return SemesterSeason.SUMMER;
    case "winter":
      return SemesterSeason.WINTER;
    default:
      throw new Error(`Unknown season ${season}`);
  }
}

export function mapSeasonToApi(season: SemesterSeason): "winter" | "summer" {
  switch (season) {
    case SemesterSeason.SUMMER:
      return "summer";
    case SemesterSeason.WINTER:
      return "winter";
    default:
      throw new Error(`Unknown season ${season}`);
  }
}

export function mapApiLecturer(apiLecturer: LecturerApiData): Lecturer {
  const lecturer: Lecturer = {
    id: apiLecturer.id,
    firstName: apiLecturer.first_name,
    lastName: apiLecturer.last_name,
    abbreviation: apiLecturer.abbreviation,
    notes: apiLecturer.notes,
    kind: apiLecturer.kind,
    isRelevant: apiLecturer.is_relevant,
    extraData: apiLecturer.extra_data,
  };
  return lecturer;
}

export function mapApiStudyGroup(
  apiStudyGroup: StudyGroupApiData,
  resolveDegreeProgram: (id: number) => DegreeProgram | undefined
): StudyGroup {
  const degreeProgram = resolveDegreeProgram(apiStudyGroup.degree_program);
  if (!degreeProgram) throw Error(`DegreeProgram ${apiStudyGroup.degree_program} not in store`);

  const studyGroup: StudyGroup = {
    id: apiStudyGroup.id,
    semesterSeason: mapApiSeason(apiStudyGroup.semester_season),
    semesterYear: apiStudyGroup.semester_year,
    studentCount: apiStudyGroup.student_count,
    degreeProgram: degreeProgram,
    extraData: apiStudyGroup.extra_data,
  };
  return studyGroup;
}

export function mapApiRoom(apiRoom: RoomApiData) {
  const room: Room = {
    id: apiRoom.id,
    seats: apiRoom.seats,
    number: apiRoom.number,
    name: apiRoom.name,
    extraData: apiRoom.extra_data,
  };
  return room;
}

export function mapApiDegreeProgram(apiDegreeProgram: DegreeProgramApiData) {
  const degreeProgram: DegreeProgram = {
    id: apiDegreeProgram.id,
    name: apiDegreeProgram.name,
    abbreviation: apiDegreeProgram.abbreviation,
    extraData: apiDegreeProgram.extra_data,
  };
  return degreeProgram;
}

export function mapStudyGroupUpdatesToApi(
  updates: Partial<Omit<StudyGroup, "id">>
): Partial<Omit<StudyGroupApiData, "id">> {
  const apiUpdates: Partial<Omit<StudyGroupApiData, "id">> = {};

  if (updates.semesterSeason !== undefined)
    apiUpdates.semester_season = mapSeasonToApi(updates.semesterSeason);
  if (updates.semesterYear !== undefined) apiUpdates.semester_year = updates.semesterYear;
  if (updates.studentCount !== undefined) apiUpdates.student_count = updates.studentCount;
  if (updates.degreeProgram !== undefined) apiUpdates.degree_program = updates.degreeProgram.id;
  if (updates.extraData !== undefined) apiUpdates.extra_data = updates.extraData;

  return apiUpdates;
}

export function mapLecturerUpdatesToApi(
  updates: Partial<Omit<Lecturer, "id">>
): Partial<Omit<LecturerApiData, "id">> {
  const apiUpdates: Partial<Omit<LecturerApiData, "id">> = {};

  if (updates.abbreviation !== undefined) apiUpdates.abbreviation = updates.abbreviation;
  if (updates.firstName !== undefined) apiUpdates.first_name = updates.firstName;
  if (updates.lastName !== undefined) apiUpdates.last_name = updates.lastName;
  if (updates.notes !== undefined) apiUpdates.notes = updates.notes;
  if (updates.isRelevant !== undefined) apiUpdates.is_relevant = updates.isRelevant;
  if (updates.kind !== undefined) apiUpdates.kind = updates.kind;
  if (updates.extraData !== undefined) apiUpdates.extra_data = updates.extraData;

  return apiUpdates;
}

export function mapRoomUpdatesToApi(
  updates: Partial<Omit<Room, "id">>
): Partial<Omit<RoomApiData, "id">> {
  const apiUpdates: Partial<Omit<RoomApiData, "id">> = {};

  if (updates.name !== undefined) apiUpdates.name = updates.name;
  if (updates.number !== undefined) apiUpdates.number = updates.number;
  if (updates.seats !== undefined) apiUpdates.seats = updates.seats;
  if (updates.extraData !== undefined) apiUpdates.extra_data = updates.extraData;

  return apiUpdates;
}

export function mapDegreeProgramUpdatesToApi(
  updates: Partial<Omit<DegreeProgram, "id">>
): Partial<Omit<DegreeProgramApiData, "id">> {
  const apiUpdates: Partial<Omit<DegreeProgramApiData, "id">> = {};

  if (updates.name !== undefined) apiUpdates.name = updates.name;
  if (updates.abbreviation !== undefined) apiUpdates.abbreviation = updates.abbreviation;
  if (updates.extraData !== undefined) apiUpdates.extra_data = updates.extraData;

  return apiUpdates;
}

/**
 * Erstellt aus den Daten der API einen Kurs.
 *
 * @param apiCourse - CourseApiData der DB
 * @param apiLecturers - Zugehörige Dozenten zum Kurs
 * @param apiStudyGroups - Zugehörige Studiengruppen zum Kurs
 * @param color - Zugewiesene Farbe
 * @param timeSlots - Zeitspannen, in der der Kurs liegt
 * @returns Ein Course-Objekt
 */
export function mapApiCourse(
  apiCourse: CourseApiData,
  apiLecturers: LecturerApiData[],
  apiStudyGroups: StudyGroupApiData[],
  color?: Color,
  timeSlots?: TimeSlot[],
  extraData?: Record<string, string>
) {
  const degreeProgramStore = useDegreeProgramStore();
  const lecturers: Lecturer[] = apiLecturers.map(l => mapApiLecturer(l));
  const studyGroups: StudyGroup[] = apiStudyGroups.map(s => {
    return mapApiStudyGroup(s, degreeProgramStore.readDegreeProgram);
  });
  const course: Course = {
    id: apiCourse.id,
    name: apiCourse.name,
    number: apiCourse.number,
    abbreviation: apiCourse.abbreviation,
    sws: apiCourse.sws,
    creditPoints: apiCourse.credit_points,
    lecturers: lecturers,
    studyGroups: studyGroups,
    color: color ?? undefined,
    timeSlots: timeSlots ?? [],
    extraData: extraData ?? undefined,
  };

  return course;
}

/**
 * Wandelt einfache Update-Attribute in das Format für den JSON-Body um. Dozenten, Studiengruppen und Farben werden im Store gehandhabt.
 * @param updates - Objekt mit variablen Attributen, je nachdem was verändert werden soll.
 * @returns Objekt mit Feldern im API-Format
 */
export function mapCourseUpdatesToApi(
  updates: Partial<Omit<Course, "id">>
): Partial<Omit<CourseApiData, "id">> {
  const apiUpdates: Partial<Omit<CourseApiData, "id">> = {};

  if (updates.abbreviation !== undefined) apiUpdates.abbreviation = updates.abbreviation;
  if (updates.name !== undefined) apiUpdates.name = updates.name;
  if (updates.number !== undefined) apiUpdates.number = updates.number;
  if (updates.sws !== undefined) apiUpdates.sws = updates.sws;
  if (updates.creditPoints !== undefined) apiUpdates.credit_points = updates.creditPoints;
  if (updates.extraData !== undefined) apiUpdates.extra_data = updates.extraData;

  return apiUpdates;
}

export function transformStartDate(start: Date): string {
  const hour: string = start.getHours().toString();
  const minutes: string = start.getMinutes().toString();
  const at: string = `${hour.padStart(2, "0")}:${minutes.padStart(2, "0")}`;

  return at;
}

export function calculateDuration(start: Date, end: Date): string {
  const durationMs: number = end.getTime() - start.getTime();
  const durationHours: number = Math.floor(durationMs / (1000 * 3600));
  const durationMinutes: number = Math.floor((durationMs % (1000 * 3600)) / (1000 * 60));
  const duration: string = toInterval(durationHours, durationMinutes);

  return duration;
}

export function mapTimeSlotToApi(courseId: number, timeSlot: TimeSlot): TimeSlotApiData {
  const at = transformStartDate(timeSlot.start);
  const duration = calculateDuration(timeSlot.start, timeSlot.end);

  const apiTimeSlot: TimeSlotApiData = {
    id: timeSlot.id,
    course: courseId,
    weekday: timeSlot.start.getDay(),
    at,
    duration,
  };

  return apiTimeSlot;
}

export function mapTimeSlotUpdatesToApi(
  updates: Partial<Omit<TimeSlot, "id">>,
  oldTimeSlot: TimeSlot
): Partial<Omit<TimeSlotApiData, "id">> {
  const apiUpdates: Partial<Omit<TimeSlotApiData, "id">> = {};

  if (updates.start) {
    apiUpdates.weekday = updates.start.getDay();
    apiUpdates.at = transformStartDate(updates.start);
  }

  if (updates.start && updates.end) {
    apiUpdates.duration = calculateDuration(updates.start, updates.end);
  } else if (updates.start && !updates.end) {
    apiUpdates.duration = calculateDuration(updates.start, oldTimeSlot.end);
  } else if (!updates.start && updates.end) {
    apiUpdates.duration = calculateDuration(oldTimeSlot.start, updates.end);
  } else {
    apiUpdates.duration = calculateDuration(oldTimeSlot.start, oldTimeSlot.end);
  }
  return apiUpdates;
}

export function mapApiTimeSlot(apiTimeSlot: TimeSlotApiData, rooms?: Room[]): TimeSlot {
  const [y, m, d] = timetableConfig.viewDate.split("-").map(Number);
  if (y === undefined || m === undefined) throw Error("Fehlerhaftes Datum in der TimeTableConfig");

  const defaultDate: Date = new Date(y, m - 1, d);

  const [hour, minute] = apiTimeSlot.at.split(":").map(Number);
  if (hour === undefined || minute === undefined) throw Error("Fehlerhafte Startzeit");

  const defaultDay: number = defaultDate.getDay();
  const timeSlotDay: number = apiTimeSlot.weekday;

  let diff = timeSlotDay - defaultDay;
  //Sonntage müssen anders behandelt werden
  // am Sonntag ist der Wochentag = 0 -> referenziert den Sonntag vor der betrachteten Woche
  // im Stundenplan wird allerdings der Sonntag dieser Woche angezeigt.
  if (timeSlotDay === 0) diff += 7;

  const start = new Date(defaultDate);
  start.setDate(defaultDate.getDate() + diff);
  start.setHours(hour, minute, 0, 0);

  const duration = fromInterval(apiTimeSlot.duration);

  const end = new Date(start);
  end.setHours(end.getHours() + duration.hours);
  end.setMinutes(end.getMinutes() + duration.minutes);

  const timeSlot: TimeSlot = {
    id: apiTimeSlot.id,
    start: start,
    end: end,
    rooms: rooms ? rooms : [],
  };

  return timeSlot;
}

function toInterval(hours: number, minutes: number): string {
  const intervalHours = hours.toString().padStart(2, "0");
  const intervalMinutes = minutes.toString().padStart(2, "0");
  return `${intervalHours}:${intervalMinutes}:00`;
}

function fromInterval(interval: string): { hours: number; minutes: number } {
  const parts = interval.split(":");
  if (parts.length < 3) throw Error("Invalid interval-format for TimeSlot");
  if (parts[0] === undefined || parts[1] === undefined)
    throw Error("Invalid interval-format for TimeSlot: Hours or Minutes not correct.");

  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);

  return { hours, minutes };
}

export function mapApiResourceConflict(apiConflict: ResourceConflictApiData): ResourceConflict {
  const conflict: ResourceConflict = {
    resourceType: apiConflict.resource_type,
    resourceId: apiConflict.resource_id,
    weekday: apiConflict.weekday,
    slotA: apiConflict.slot_a_id,
    slotACourse: apiConflict.slot_a_course,
    slotATime: apiConflict.slot_a_at,
    slotADuration: apiConflict.slot_a_duration,
    slotB: apiConflict.slot_b_id,
    slotBCourse: apiConflict.slot_b_course,
    slotBTime: apiConflict.slot_b_at,
    slotBDuration: apiConflict.slot_b_duration,
  };
  return conflict;
}

export function mapResourceConflictToApi(conflict: ResourceConflict): ResourceConflictApiData {
  const apiConflict: ResourceConflictApiData = {
    resource_type: conflict.resourceType,
    resource_id: conflict.resourceId,
    weekday: conflict.weekday,
    slot_a_id: conflict.slotA,
    slot_a_course: conflict.slotACourse,
    slot_a_at: conflict.slotATime,
    slot_a_duration: conflict.slotADuration,
    slot_b_id: conflict.slotB,
    slot_b_course: conflict.slotBCourse,
    slot_b_at: conflict.slotBTime,
    slot_b_duration: conflict.slotBDuration,
  };
  return apiConflict;
}

export function mapApiIgnoredResourceConflict(
  apiIgnoredConflict: IgnoredResourceConflictApiData
): IgnoredResourceConflict {
  const ingoredConflict: IgnoredResourceConflict = {
    slotA: apiIgnoredConflict.slot_a,
    slotB: apiIgnoredConflict.slot_b,
    resourceType: apiIgnoredConflict.resource_type,
    resourceId: apiIgnoredConflict.resource_id,
  };
  return ingoredConflict;
}

export function mapIgnoredResourceConflictToApi(
  ignoredConflict: IgnoredResourceConflict
): IgnoredResourceConflictApiData {
  const apiIgnoredConflict: IgnoredResourceConflictApiData = {
    slot_a: ignoredConflict.slotA,
    slot_b: ignoredConflict.slotB,
    resource_type: ignoredConflict.resourceType,
    resource_id: ignoredConflict.resourceId,
  };
  return apiIgnoredConflict;
}

export function mapTemplateUpdatesToApi(
  updates: Partial<Omit<StudyGroupTemplate, "id">>
): Partial<Omit<StudyGroupTemplateApiData, "id">> {
  const apiUpdates: Partial<Omit<StudyGroupTemplateApiData, "id">> = {};

  if (updates.name !== undefined) apiUpdates.name = updates.name;

  return apiUpdates;
}

export function mapApiTemplate(
  apiTemplates: StudyGroupTemplateApiData,
  courses: Course[]
): StudyGroupTemplate {
  const template: StudyGroupTemplate = {
    id: apiTemplates.id,
    name: apiTemplates.name,
    courses: courses,
  };
  return template;
}
