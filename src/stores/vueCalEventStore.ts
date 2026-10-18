import { defineStore } from "pinia";
import { computed, reactive, shallowRef, watch } from "vue";
import { useCourseStore } from "./courseStore";
import type { VueCalEvent } from "@/models/VueCalEvent";
import type { Course } from "@/models/Course";
import type { TimeSlot } from "@/models/TimeSlot";
import type { ResourceConflict } from "@/models/ResourceConflict";
import { Tab } from "@/enums/enums";
import { useColorStore } from "./colorStore";
import { useViewStore } from "./viewStore";
import { useResourceConflictStore } from "./resourceConflictsStore";
import { useStudyGroupStore } from "./studyGroupStore";

const white = "#FFFFFF";
const noConflicts: ResourceConflict[] = [];

/**
 * Pinia Store, der die im Kalender angezeigten Events aus Kursen und Zeitslots ableitet.
 *
 * Die Events werden aus den Stores neu berechnet und in stabile Objekte übernommen (ein Objekt pro id),
 * weil vue-cal das Objekt einer Event-Komponente ab dem Mount festhält.
 *
 * @returns Ein Objekt mit:
 * - calendarEvents: Liste der Events für den aktuellen Tab
 */
export const useVueCalEventStore = defineStore("vueCalEvents", () => {
  const courseStore = useCourseStore();
  const colorStore = useColorStore();
  const viewStore = useViewStore();
  const conflictsStore = useResourceConflictStore();
  const studyGroupStore = useStudyGroupStore();

  /**
   * Erzeugt ein neues VueCalEvent zu einem Zeitslot.
   * @param course - Kurs, zu dem der Zeitslot gehört
   * @param timeSlot - Zeitslot des Events
   * @param studyGroupId - Studiengruppe (= Spalte), falls der Kalender Schedules anzeigt
   * @returns neues VueCalEvent
   */
  function toEvent(course: Course, timeSlot: TimeSlot, studyGroupId?: number): VueCalEvent {
    const id = studyGroupId === undefined ? `${timeSlot.id}` : `${timeSlot.id}-${studyGroupId}`;
    return {
      id,
      courseId: course.id,
      timeSlotId: timeSlot.id,
      // Kopien, da vue-cal die übergebenen Dates normalisiert (setSeconds etc.)
      start: new Date(timeSlot.start),
      end: new Date(timeSlot.end),
      title: course.name,
      backgroundColor: course.color
        ? (colorStore.colorMap.get(course.color.id)?.hex ?? white)
        : white,
      schedule: studyGroupId,
      studyGroupId,
      conflicts: conflictsStore.timeSlotConflictsMap.get(timeSlot.id) ?? noConflicts,
    };
  }

  /**
   * Erzeugt für jede Studiengruppe die Events ihrer Kurse, jeweils in einer eigenen Spalte.
   * @param studyGroupIds - Ids der Studiengruppen
   * @returns Liste der Events
   */
  function scheduleEvents(studyGroupIds: number[]): VueCalEvent[] {
    return studyGroupIds.flatMap(studyGroupId =>
      courseStore
        .coursesByStudyGroup(studyGroupId)
        .flatMap(course => course.timeSlots.map(ts => toEvent(course, ts, studyGroupId)))
    );
  }

  /**
   * Erzeugt die Events aller Kurse, die zur ausgewählten Ressource gehören.
   * @param tab - Art der Ressource
   * @param id - Id der Ressource
   * @returns Liste der Events
   */
  function filteredEvents(tab: Tab, id: number): VueCalEvent[] {
    return courseStore.courseList.flatMap(course => {
      switch (tab) {
        case Tab.LECTURER:
          return course.lecturers.some(l => l.id === id)
            ? course.timeSlots.map(ts => toEvent(course, ts))
            : [];
        case Tab.STUDYGROUP:
          return course.studyGroups.some(sg => sg.id === id)
            ? course.timeSlots.map(ts => toEvent(course, ts))
            : [];
        case Tab.ROOM:
          return course.timeSlots
            .filter(ts => ts.rooms.some(r => r.id === id))
            .map(ts => toEvent(course, ts));
        default:
          return [];
      }
    });
  }

  /**
   * Die Events für den aktuellen Tab, bei jeder Änderung neu berechnet
   */
  const derivedEvents = computed<VueCalEvent[]>(() => {
    const { tab, selected } = viewStore.view;
    const selectedId = selected[tab];
    switch (tab) {
      case Tab.COURSE:
        return scheduleEvents(viewStore.studyGroups);
      case Tab.DEGREEPROGRAM:
        if (selectedId === undefined) return [];
        return scheduleEvents(
          studyGroupStore.studyGroupsByDegreeProgram(selectedId).map(group => group.id)
        );
      default:
        return selectedId === undefined ? [] : filteredEvents(tab, selectedId);
    }
  });

  /**
   * Die im Kalender angezeigten Events. Pro id bleibt es immer dasselbe Objekt, da eine
   * vue-cal-Event-Komponente ihr Objekt ab dem Mount festhält (`reactive(props.event)`).
   */
  const calendarEvents = shallowRef<VueCalEvent[]>([]);
  let eventsById = new Map<string, VueCalEvent>();

  /**
   * Übernimmt neu berechnete Events in die bestehenden Objekte, neue ids werden angelegt.
   * @param next - neu berechnete Events
   */
  function syncEvents(next: VueCalEvent[]) {
    const nextById = new Map<string, VueCalEvent>();
    calendarEvents.value = next.map(data => {
      const { start, end, ...rest } = data;
      const event = eventsById.get(data.id) ?? reactive({ ...data, _: { id: data.id } });
      // Dates nur bei echter Änderung ersetzen, sonst rendert jedes Event bei jeder Neuberechnung neu
      if (event.start.getTime() !== start.getTime()) event.start = start;
      if (event.end.getTime() !== end.getTime()) event.end = end;
      // `_` (interne vue-cal-Daten) bleibt erhalten, da `rest` es nicht enthält
      Object.assign(event, rest);
      nextById.set(data.id, event);
      return event;
    });
    eventsById = nextById;
  }

  watch(derivedEvents, syncEvents, { immediate: true });

  return {
    calendarEvents,
  };
});
