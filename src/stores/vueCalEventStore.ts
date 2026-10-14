import { defineStore, storeToRefs } from "pinia";
import { computed, reactive } from "vue";
import { useCourseStore } from "./courseStore";
import type { VueCalEvent } from "@/models/VueCalEvent";
import { useColorStore } from "./colorStore";
import { useSettingsStore } from "./settingsStore";
import { useResourceConflictStore } from "./resourceConflictsStore";

/**
 * Pinia Store für die Verwaltung von VueCal Events
 *
 * @returns Ein Objekt mit:
 * - vueCalEventsList: Computed Liste aller VueCal Events, generiert aus Kursen, Zeitfenstern und Studiengruppen
 */
export const useVueCalEventStore = defineStore("vueCalEvents", () => {
  const courseStore = useCourseStore();
  const colorStore = useColorStore();
  const settingsStore = useSettingsStore();
  const conflictsStore = useResourceConflictStore();

  const { plannerSettings } = storeToRefs(settingsStore);

  const cache = new Map<string, VueCalEvent>();
  const filteredCache = new Map<string, VueCalEvent>();

  /**
   * Gibt eine eindeutige Id zu einem VueCalEvent zurück.
   * @param event - VueCalEvent, zu dem man die Id wissen will
   * @returns id des Events
   */
  function getVueCalEventId(event: VueCalEvent) {
    return `${event.timeSlotId}-${event.schedule}`;
  }

  /**
   * Schaut, ob ein Objekt bereits im Cache angezeigt wird.
   * Wenn dies der Fall ist wird das bereits existierende Objekt verwendet, damit ein Neubefüllen der Eventliste keine Aktualisierung erzeugt.
   * @param event - VueCalEvent, dass im Cache vorhanden sein kann
   * @param targetCache - Cache, der zum cashen verwendet werden soll
   * @param cacheKey - Schlüssel, der für targetCache verwendet wird
   * @returns existierendes Event aus dem Cache oder ein neu erzeugtes Event
   */
  function getEvent(event: VueCalEvent, targetCache: Map<string, VueCalEvent>, cacheKey: string) {
    const existingEvent = targetCache.get(cacheKey);

    if (existingEvent) {
      existingEvent.start = event.start;
      existingEvent.end = event.end;
      existingEvent.title = event.title;
      existingEvent.backgroundColor = event.backgroundColor;
      existingEvent.schedule = event.schedule;
      existingEvent.conflicts = [...event.conflicts];
      return existingEvent;
    } else {
      const reactiveEvent = reactive(event);
      targetCache.set(cacheKey, reactiveEvent);
      return reactiveEvent;
    }
  }

  /**
   * Liste der angezeigten Events im Kalender in der Planungsansicht
   */
  const vueCalEventsList = computed(() => {
    const activeEventIds = new Set<string>();
    const events: VueCalEvent[] = [];
    const white = "#FFFFFF";

    if (plannerSettings.value.studyGroups.size === 0) {
      cache.clear();
      return [];
    }

    for (const studyGroup of [...plannerSettings.value.studyGroups]) {
      const courses = courseStore.coursesByStudyGroup(studyGroup);
      for (const course of courses) {
        const color = course.color;
        const bgColor = color ? (colorStore.colorMap.get(color.id)?.hex ?? white) : white;
        for (const timeSlot of course.timeSlots) {
          const event = getEvent(
            {
              id: `${timeSlot.id}-${studyGroup}`,
              courseId: course.id,
              timeSlotId: timeSlot.id,
              start: timeSlot.start,
              end: timeSlot.end,
              title: course.name,
              backgroundColor: bgColor,
              schedule: studyGroup,
              conflicts: conflictsStore.timeSlotConflictsMap.get(timeSlot.id) ?? [],
            },
            cache,
            `${timeSlot.id}-${studyGroup}`
          );
          activeEventIds.add(getVueCalEventId(event));
          events.push(event);
        }
      }
    }

    //Alte Events aus dem Cache leeren, die nicht mehr aktiv sind
    for (const eventId of cache.keys()) {
      if (!activeEventIds.has(eventId)) {
        cache.delete(eventId);
      }
    }

    return events;
  });

  const getFilteredEvents = computed(() => {
    const activeEventIds = new Set<string>();
    const type = plannerSettings.value.tab;
    const id = plannerSettings.value.selectedId;
    const list = courseStore.courseList
      .filter(course => {
        switch (type) {
          case "lecturer":
            return course.lecturers.some(l => l.id === id);
          case "studyGroup":
            return course.studyGroups.some(sg => sg.id === id);
          case "room":
            return course.timeSlots.some(ts => ts.rooms.some(r => r.id === id));
          default:
            return false;
        }
      })
      .flatMap(course =>
        course.timeSlots
          .filter(ts => type !== "room" || ts.rooms.some(r => r.id === id))
          .map(ts => {
            //Event aus Cache holen, falls es vorhanden ist, um Neuladen des Kalenders zu verhindern
            const event = getEvent(
              {
                id: `${ts.id}`,
                courseId: course.id,
                timeSlotId: ts.id,
                start: ts.start,
                end: ts.end,
                title: course.name,
                backgroundColor: course.color?.hex ?? "#FFFFFF",
                conflicts: conflictsStore.timeSlotConflictsMap.get(ts.id) ?? [],
              },
              filteredCache,
              `${ts.id}`
            );
            activeEventIds.add(event.id);
            return event;
          })
      );

    for (const eventId of filteredCache.keys()) {
      if (!activeEventIds.has(eventId)) {
        filteredCache.delete(eventId);
      }
    }
    return list;
  });

  return {
    vueCalEventsList,
    getFilteredEvents,
    getVueCalEventId,
  };
});
