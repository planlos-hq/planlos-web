import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Course } from "@/models/Course";
import { useNotification } from "@/composables/useNotification";
import {
  assignColorToCourseApi,
  assignLecturerToCourseApi,
  assignStudyGroupToCourseApi,
  createCourseApi,
  deleteCourseApi,
  removeColorFromCourseApi,
  removeLecturerFromCourseApi,
  removeStudyGroupFromCourseApi,
  updateCourseApi,
} from "@/api/course";
import type { CourseApiData } from "@/api/types";
import { mapCourseUpdatesToApi } from "@/api/util";
import type { TimeSlot } from "@/models/TimeSlot";
import { deleteTimeSlotApi, removeRoomFromTimeSlotApi } from "@/api/timeslot";
import { useTimeSlotStore } from "./timeSlotStore";
import { Tab } from "@/enums/enums";
import { useViewStore } from "./viewStore";

/**
 * Pinia Store für die Verwaltung von Kursen
 *
 * @returns Ein Objekt mit:
 * - courseList: Reaktive Liste aller Kurse
 * - selectedCourse: Ausgewählte Ressource laut Ansicht (URL)
 * - createCourse: Funktion zum Erstellen eines neuen Kurses
 * - readCourse: Funktion zum Abrufen eines Kurses per ID
 * - updateCourse: Funktion zum Aktualisieren eines Kurses
 * - deleteCourse: Funktion zum Löschen eines Kurses
 */
export const useCourseStore = defineStore("courses", () => {
  const courseMap = ref<Map<number, Course>>(new Map<number, Course>());
  const courseList = computed(() => Array.from(courseMap.value.values()));
  const viewStore = useViewStore();
  const highlightedCourseId = ref<number | null>(null);
  const highlightTrigger = ref(0);
  const { handleError, showError, showSuccess } = useNotification();

  /**
   * Erstellt einen neuen Kurs und fügt ihn zur Kursliste hinzu
   *
   * @param data - Benötigt ein Course-Objekt ohne ID
   */
  async function createCourse(data: Omit<Course, "id">) {
    const { number, name, abbreviation, sws, creditPoints, lecturers, studyGroups, extraData } =
      data;

    try {
      const apiCourse: CourseApiData | undefined = await createCourseApi(
        number,
        name,
        abbreviation,
        sws,
        creditPoints,
        extraData
      );

      if (apiCourse === undefined) return;

      for (const l of lecturers ?? []) {
        await assignLecturerToCourseApi(apiCourse.id, l.id);
      }
      for (const s of studyGroups ?? []) {
        await assignStudyGroupToCourseApi(apiCourse.id, s.id);
      }
      showSuccess("Veranstaltung erfolgreich erstellt!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Erstellen einer Veranstaltung.");
    }
  }

  /**
   * Sucht alle Kurse mit einer bestimmten Kursnummer.
   *
   * @param number - Die zu prüfende Kursnummer
   * @returns Alle Kurse mit dieser Nummer (leeres Array, falls keiner existiert)
   */
  function findCoursesByNumber(number: string): Course[] {
    const searchNumber = number.trim();
    return courseList.value.filter(course => course.number.trim() === searchNumber);
  }

  /**
   * Sucht einen Kurs anhand seiner ID
   *
   * @param id - Die eindeutige ID des Kurses
   * @returns Der gefundene Kurs oder undefined, falls nicht vorhanden
   */
  function readCourse(id: number): Course | undefined {
    const course = courseMap.value.get(id);
    if (!course) {
      showError("Fehler", "Veranstaltung konnte nicht gefunden werden.");
    }
    return course;
  }

  /**
   * Aktualisiert einen existierenden Kurs mit neuen Werten
   *
   * @param id - Die ID des zu aktualisierenden Kurses
   * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
   * @param callFromCalender - Wenn im Kalender die Zuweisung geändert wird, soll nur eine Nachricht erscheinen, wenn tatsächlich eine Änderung erfolgt ist.
   *
   * @example updateCourse(12345, \{ name: "Neuer Kursname", sws: 4 \});
   */
  async function updateCourse(
    id: number,
    updates: Partial<Omit<Course, "id">>,
    callFromCalender?: boolean
  ) {
    try {
      const course = courseMap.value.get(id);
      if (!course) throw Error("Kurs nicht gefunden.");

      const apiUpdates = mapCourseUpdatesToApi(updates);
      const apiCourse = await updateCourseApi(id, apiUpdates);

      /*
      Lecturer- und StudyGroup-Zuweisung ()
        1. Update Kurse betrachten
        2. Für jedes Update schauen, ob diese bereits in DB vorhanden sind -> wenn nicht assignen
        3. Api Kurse betrachten
        4. Für jeden Apikurs schauen, ob dieser in Updates vorhanden ist -> wenn nicht removen
      */

      if (updates.lecturers !== undefined) {
        const courseLecturers = [...course.lecturers];
        const courseLecturersIds = courseLecturers.map(l => l.id);
        const updateIds = updates.lecturers.map(l => l.id);

        for (const l of updates.lecturers) {
          if (courseLecturersIds.indexOf(l.id) === -1) {
            await assignLecturerToCourseApi(id, l.id);
          }
        }

        for (const l of courseLecturers) {
          if (updateIds.indexOf(l.id) === -1) {
            await removeLecturerFromCourseApi(id, l.id);
          }
        }
        //Zuweisung in LecturerList erfolgt über Server-Sent-Events
      }

      if (updates.studyGroups !== undefined) {
        const courseStudyGroups = [...course.studyGroups];
        const courseStudyGroupsIds = courseStudyGroups.map(l => l.id);
        const updateIds = updates.studyGroups.map(s => s.id);

        for (const s of updates.studyGroups) {
          if (courseStudyGroupsIds.indexOf(s.id) === -1) {
            await assignStudyGroupToCourseApi(id, s.id);
          }
        }

        for (const s of courseStudyGroups) {
          if (updateIds.indexOf(s.id) === -1) {
            await removeStudyGroupFromCourseApi(id, s.id);
          }
        }
        //Zuweisung in StudyGroupList erfolgt über Server-Sent-Events
      }

      if (updates.color !== undefined) {
        const courseColor = course.color;
        if (courseColor !== undefined) {
          await removeColorFromCourseApi(id, courseColor.id);
        }
        await assignColorToCourseApi(apiCourse.id, updates.color.id);
      }

      //Standardmäßige Nachricht, wenn ein Kursupdate über das Bearbeitenfenster erfolgte.
      if (callFromCalender === undefined || !callFromCalender) {
        showSuccess("Veranstaltung erfolgreich aktualisiert!");
        return;
      }
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Aktualisieren einer Veranstaltung.");
    }
  }

  /**
   * Löscht einen Kurs aus der Liste
   *
   * @param id - Die ID des zu löschenden Kurses
   */
  async function deleteCourse(id: number) {
    try {
      const course = courseMap.value.get(id);

      if (course === undefined) {
        throw new Error("Veranstaltung konnte nicht gefunden werden.");
      }
      const lecturers = [...course.lecturers];
      const timeSlots = [...course.timeSlots];
      const studyGroups = [...course.studyGroups];

      if (lecturers.length !== 0) {
        for (const l of lecturers) {
          await removeLecturerFromCourseApi(course.id, l.id);
        }
      }
      if (studyGroups.length !== 0) {
        for (const s of studyGroups) {
          await removeStudyGroupFromCourseApi(course.id, s.id);
        }
      }
      if (timeSlots.length !== 0) {
        for (const t of timeSlots) {
          for (const r of t.rooms) {
            await removeRoomFromTimeSlotApi(t.id, r.id);
          }
          await deleteTimeSlotApi(t.id);
        }
      }
      if (course.color) {
        await removeColorFromCourseApi(course.id, course.color.id);
      }

      await deleteCourseApi(id);
      showSuccess("Veranstaltung erfolgreich gelöscht!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Löschen einer Veranstaltung!");
    }
  }

  /**
   * Die in der Ansicht (URL) ausgewählte Ressource, undefined falls keine gewählt ist oder sie nicht existiert
   */
  const selectedCourse = computed(() => {
    const id = viewStore.view.selected[Tab.COURSE];
    return id === undefined ? undefined : courseMap.value.get(id);
  });

  /**
   * Liefert alle Kurse, denen eine bestimmte Studiengruppe zugeordnet ist.
   *
   * @param groupId - ID der Studiengruppe
   * @returns Liste aller Kurse, die diese Studiengruppe in ihrem studyGroups-Array enthalten
   */
  const coursesByStudyGroup = computed(
    () => (groupId: number) =>
      courseList.value.filter(course => course.studyGroups.some(sg => sg.id === groupId))
  );

  /**
   * Fügt einen TimeSlot zu einem Kurs hinzu.
   *
   * @param courseId - ID der Veranstaltung
   * @param timeSlot - Zeitslot der Veranstaltung
   */
  function assignTimeSlotToCourse(courseId: number, timeSlot: TimeSlot) {
    const course = courseMap.value.get(courseId);
    if (course === undefined) {
      showError("Fehler", "Die Veranstaltung konnte nicht gefunden werden");
      return;
    }
    //Verhindert, dass bei Server-Sent-Events der Timeslot doppelt eingefügt wird
    const alreadyExists = course.timeSlots.some(t => t.id === timeSlot.id);
    if (alreadyExists) {
      return;
    }
    course.timeSlots.push(timeSlot);
    const timeSlotStore = useTimeSlotStore();
    timeSlotStore.timeSlotCourseAssignmentsMap.set(timeSlot.id, courseId);
  }

  /**
   * Markiert einen Kurs, damit dessen sichtbare Timeslots im Kalender kurz aufleuchten.
   * Erhöht zusätzlich den Trigger-Zähler, sodass die Animation auch bei wiederholtem Klick
   * auf denselben Kurs erneut startet.
   *
   * @param courseId - ID der Veranstaltung, deren Timeslots hervorgehoben werden sollen
   */
  function highlightCourse(courseId: number) {
    highlightedCourseId.value = courseId;
    highlightTrigger.value++;
  }

  return {
    courseList,
    courseMap,
    selectedCourse,
    highlightedCourseId,
    highlightTrigger,
    createCourse,
    findCoursesByNumber,
    readCourse,
    updateCourse,
    deleteCourse,
    highlightCourse,
    assignTimeSlotToCourse,
    coursesByStudyGroup,
  };
});
