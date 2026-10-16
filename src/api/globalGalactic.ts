import type { Lecturer } from "@/models/Lecturer";
import type { GlobalApiData } from "./types";
import {
  mapApiDegreeProgram,
  mapApiLecturer,
  mapApiRoom,
  mapApiStudyGroup,
  mapApiTimeSlot,
  mapApiTemplate,
} from "./util";
import type { StudyGroup } from "@/models/StudyGroup";
import type { Color } from "@/models/Color";
import { useDegreeProgramStore } from "@/stores/degreeProgramStore";
import { useLecturerStore } from "@/stores/lecturerStore";
import { useStudyGroupStore } from "@/stores/studyGroupStore";
import { useRoomStore } from "@/stores/roomStore";
import { useColorStore } from "@/stores/colorStore";
import type { Course } from "@/models/Course";
import { useCourseStore } from "@/stores/courseStore";
import type { TimeSlot } from "@/models/TimeSlot";
import { useNotification } from "@/composables/useNotification";
import { useTimeSlotStore } from "@/stores/timeSlotStore";
import { useTemplateStore } from "@/stores/templateStore";
import { useConnectionStore } from "@/stores/connectionStore";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Lädt alle Ressourcen aus der Datenbank.

 * @returns alle vorhandenen Ressourcen
 */
export async function getGlobalGalacticApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/global-galaktisch`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const data: GlobalApiData = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getAllApplicationData() {
  const { handleError } = useNotification();
  try {
    const degreeProgramStore = useDegreeProgramStore();
    const lecturerStore = useLecturerStore();
    const studyGroupStore = useStudyGroupStore();
    const roomStore = useRoomStore();
    const colorStore = useColorStore();
    const courseStore = useCourseStore();
    const timeSlotStore = useTimeSlotStore();
    const templateStore = useTemplateStore();

    const data: GlobalApiData = await getGlobalGalacticApi();

    degreeProgramStore.degreeProgramMap.clear();
    lecturerStore.lecturerMap.clear();
    studyGroupStore.studyGroupMap.clear();
    roomStore.roomMap.clear();
    colorStore.colorMap.clear();
    courseStore.courseMap.clear();
    timeSlotStore.timeSlotMap.clear();
    timeSlotStore.timeSlotCourseAssignmentsMap.clear();

    data.degree_programs.forEach(d => {
      degreeProgramStore.degreeProgramMap.set(d.id, mapApiDegreeProgram(d));
    });

    data.lecturers.forEach(lecturer => {
      const l = mapApiLecturer(lecturer);
      lecturerStore.lecturerMap.set(l.id, l);
    });

    data.study_groups.forEach(studyGroup => {
      const s = mapApiStudyGroup(studyGroup, degreeProgramStore.readDegreeProgram);
      studyGroupStore.studyGroupMap.set(s.id, s);
    });

    data.rooms.forEach(r => {
      roomStore.roomMap.set(r.id, mapApiRoom(r));
    });

    data.course_colors.forEach(c => {
      colorStore.colorMap.set(c.id, c);
    });

    data.courses.forEach(apiCourse => {
      const lecturers: Lecturer[] = data.course_lecturers
        .filter(c => c.course === apiCourse.id)
        .map(c => lecturerStore.readLecturer(c.lecturer))
        .filter(lecturer => lecturer !== undefined);

      const studyGroups: StudyGroup[] = data.course_study_groups
        .filter(c => c.course === apiCourse.id)
        .map(c => studyGroupStore.readStudyGroup(c.study_group))
        .filter(studyGroup => studyGroup !== undefined);

      const colorAssignments = data.course_color_assignments ?? [];
      const colorAssignment = colorAssignments.find(color => color.course === apiCourse.id);

      const color: Color | undefined = colorAssignment
        ? colorStore.readColor(colorAssignment.color)
        : undefined;

      const timeSlots: TimeSlot[] = data.course_time_slots
        .filter(ts => ts.course === apiCourse.id)
        .map(ts => mapApiTimeSlot(ts));

      timeSlotStore.setTimeSlots(timeSlots, apiCourse.id);

      const timeSlotRoomAssignments = data.time_slot_room_assignments ?? [];

      for (const timeSlot of timeSlots) {
        for (const assignment of timeSlotRoomAssignments) {
          if (assignment.time_slot === timeSlot.id) {
            const room = roomStore.readRoom(assignment.room);
            if (!room) {
              continue;
            }
            timeSlot.rooms.push(room);
          }
        }
      }

      const course: Course = {
        id: apiCourse.id,
        number: apiCourse.number,
        name: apiCourse.name,
        abbreviation: apiCourse.abbreviation,
        sws: apiCourse.sws,
        creditPoints: apiCourse.credit_points,
        lecturers,
        studyGroups,
        timeSlots: timeSlots,
        color,
        extraData: apiCourse.extra_data,
      };
      courseStore.courseMap.set(course.id, course);
    });

    data.study_group_templates.forEach(apiTemplate => {
      const courses: Course[] = data.study_group_template_courses
        .filter(t => t.template === apiTemplate.id)
        .map(t => courseStore.readCourse(t.course))
        .filter(course => course !== undefined);

      const template = mapApiTemplate(apiTemplate, courses);
      templateStore.templateMap.set(template.id, template);
    });
  } catch (error) {
    // Ohne Verbindung zum Server wird statt der Anwendung die Fehleransicht angezeigt
    if (useConnectionStore().reportConnectionError(error)) {
      // eslint-disable-next-line no-console
      console.error(error);
      return;
    }
    const e = error as Error;
    handleError(e, "Fehler beim initialen Laden der Daten!");
  }
}
