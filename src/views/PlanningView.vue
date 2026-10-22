<template>
  <base-layout>
    <template #sidebar>
      <side-bar @on-event-drag-start="onEventDragStart" />
    </template>
    <template #content>
      <vue-cal
        :key="view.tab"
        v-bind="timetableConfig"
        :schedules="calendarSchedules"
        :events="vueCalEventStore.calendarEvents"
        :hide-weekdays="viewStore.hiddenWeekdays"
        :special-hours="breaks"
        @event-drop="onEventDrop"
        @event-resize="isValidResize"
        @event-resize-end="onEventResize"
      >
        <template #event="{ event }">
          <planning-event
            :event="event"
            :filter-type="view.tab"
            @click="handleEventClick(event)"
            @remove-event="deleteTimeSlot(event)"
          />
        </template>
      </vue-cal>
    </template>
  </base-layout>
  <event-overview
    v-model="showEventOverview"
    v-if="selectedEvent"
    :event="selectedEvent"
    @color="(color: Color) => paint(color)"
    @remove-event="deleteTimeSlot(selectedEvent)"
  />
  <impressum-dialog />
  <about-dialog />
  <help-dialog />
</template>

<script setup lang="ts">
  import BaseLayout from "@/template/BaseLayout.vue";
  import EventOverview from "@/components/EventOverview.vue";
  import { VueCal } from "vue-cal";
  import "vue-cal/style";
  import { specialHours, timetableConfig } from "@/timetableConfig";
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import { useStudyGroupStore } from "@/stores/studyGroupStore";
  import PlanningEvent from "@/components/PlanningEvent.vue";
  import { useVueCalEventStore } from "@/stores/vueCalEventStore";
  import type { VueCalEvent } from "@/models/VueCalEvent";
  import { useTimeSlotStore } from "@/stores/timeSlotStore";
  import { useCourseStore } from "@/stores/courseStore";
  import type { Course } from "@/models/Course";
  import SideBar from "@/components/SideBar.vue";
  import { Tab } from "@/enums/enums";
  import { handleUpdate } from "@/updates/handler.updates";
  import { useResourceConflictStore } from "@/stores/resourceConflictsStore";
  import { useViewStore } from "@/stores/viewStore";
  import { storeToRefs } from "pinia";
  import type { Color } from "@/models/Color";
  import ImpressumDialog from "@/components/ImpressumDialog.vue";
  import AboutDialog from "@/components/AboutDialog.vue";
  import HelpDialog from "@/components/HelpDialog.vue";
  import { useUndoShortcuts } from "@/composables/useUndoShortcuts";

  const vueCalEventStore = useVueCalEventStore();
  const timeSlotStore = useTimeSlotStore();
  const courseStore = useCourseStore();
  const studyGroupStore = useStudyGroupStore();
  const resourceConflictStore = useResourceConflictStore();
  const viewStore = useViewStore();
  const { view } = storeToRefs(viewStore);
  useUndoShortcuts();

  const showEventOverview = ref<boolean>(false);

  const selectedEventId = ref<string | null>(null);
  /** Das ausgewählte Event, über die id aus der aktuellen Event-Liste gesucht */
  const selectedEvent = computed(
    () => vueCalEventStore.calendarEvents.find(e => e.id === selectedEventId.value) ?? null
  );

  /**
   * Kümmert sich um den Klick auf ein Event im Kalender
   * @param event - Event aus VueCal, besteht aus e = JS Dom Event und event = clicked calender event
   */
  function handleEventClick(event: VueCalEvent) {
    selectedEventId.value = event.id;
    showEventOverview.value = true;
  }

  // Wenn das ausgewählte Event verschwindet (gelöscht, Filter geändert), wird das EventOverview geschlossen.
  watch(selectedEvent, event => {
    if (!event) showEventOverview.value = false;
  });

  /**
   * Setzt die Hintergrundfarbe des Events
   * @param color - Die ausgewählte Farbe
   */
  function paint(color: Color) {
    if (!selectedEvent.value) {
      return;
    }
    courseStore.setCourseColor(selectedEvent.value.courseId, color);
  }

  const calendarSchedules = computed(() => {
    switch (view.value.tab) {
      case Tab.COURSE:
        return studyGroupStore.schedules;
      case Tab.DEGREEPROGRAM:
        return studyGroupStore.degreeProgramSchedules;
      default:
        return [];
    }
  });

  const breaks = computed(() => {
    return view.value.showBreaks ? specialHours : {};
  });

  // Festgelegte Grenzen für Start- und Endzeitwerte
  const minStartHours = 8;

  const maxEndHour = 24;

  const minDurationMinutes = 15;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  let eventSource: EventSource | undefined = undefined;
  onMounted(async () => {
    eventSource = new EventSource(`${API_BASE_URL}/updates`);
    eventSource.onmessage = async event => {
      handleUpdate(JSON.parse(event.data));
      await resourceConflictStore.loadResourceConflicts();
      await resourceConflictStore.loadIgnoredResourceConflicts();
    };
    // lädt alle Constraint Verletzungen in den Store
    await resourceConflictStore.loadResourceConflicts();
    await resourceConflictStore.loadIgnoredResourceConflicts();
  });

  onUnmounted(() => {
    if (eventSource) {
      eventSource.close();
    }
  });

  /**
   * Löscht einen Timeslot aus dem zugehörigen Kurs,
   * sofern Kurs und Timeslot existieren.
   *
   * @param event - Ein VueCalEvent, das die IDs von Kurs und Timeslot enthält
   */
  function deleteTimeSlot(event: VueCalEvent | null) {
    if (!event) {
      return;
    }
    showEventOverview.value = false;
    const course = courseStore.readCourse(event.courseId);
    // überprüft, ob der Kurs existiert
    if (!course) return;
    // überprüft, ob der Timeslot in dem Kurs existiert
    if (!timeSlotStore.readTimeSlot(event.timeSlotId)) return;

    //löscht den timeslot
    timeSlotStore.deleteTimeSlot(event.timeSlotId);
  }

  /**
   * Wird ausgelöst, wenn ein Event aus der Sidebar in den Kalender gezogen wird.
   * Prüft zunächst, ob der Kurs zu einem sichtbaren Schedule gehört.
   * Wenn nicht, wird das Drag-&-Drop unterbunden.
   *
   * @param event - Das DragEvent des Browsers
   * @param item - Der Kurs, der gezogen wird
   */
  function onEventDragStart(event: DragEvent, item: Course) {
    if (
      item.studyGroups
        .map(s => s.id)
        .filter(s => studyGroupStore.schedules.map(schedule => schedule.id).includes(s)).length ===
      0
    ) {
      event.preventDefault();
      return;
    }
    viewStore.select(Tab.COURSE, item.id, "replace");
    event.dataTransfer?.setData("event", JSON.stringify(item));
    event.dataTransfer?.setData("cursor-grab-at", event.offsetY.toString());
  }

  /**
   * Wird ausgelöst, wenn ein Event im Kalender abgelegt wird.
   * Unterscheidet zwischen externen Drops (aus der Sidebar)
   * und internen Verschiebungen innerhalb des Kalenders.
   *
   * @param objekt - Objekt mit:
   *  - event: Das von vue-cal übergebene Event
   *  - external: True, wenn das Event von außen stammt
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onEventDrop({ event, external }: { event: any; external: boolean }): false {
    // Startzeit nicht unterhalb der festgelegten Grenze
    const start = new Date(event.start);
    if (start.getHours() < minStartHours) {
      start.setHours(minStartHours, 0, 0, 0);
    }

    // Date-Objekt mit Tagesende als Datum
    const endOfDay = new Date(start);
    endOfDay.setHours(maxEndHour, 0, 0, 0);

    if (external) {
      const course = courseStore.readCourse(event.id);
      if (!course) return false;

      // Neue Events erhalten ein Standard-Dauer von 90 Minuten
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 90);

      if (end.getTime() > endOfDay.getTime()) {
        end.setTime(endOfDay.getTime());
        start.setTime(end.getTime());
        start.setMinutes(start.getMinutes() - 90);
      }

      timeSlotStore.createTimeSlot(course.id, start, end);
    } else {
      const course = courseStore.readCourse(event.courseId);
      if (!course) return false;
      const timeSlot = timeSlotStore.readTimeSlot(event.timeSlotId);
      if (!timeSlot) return false;
      const durationMin = (timeSlot.end.getTime() - timeSlot.start.getTime()) / 1000 / 60;

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + durationMin);
      // Falls das neue Enddatum größer ist als das Tagesende, wird das Tagesende als Enddatum des Events genommen
      // Dies führt dazu, dass sich der Start des Events ändert
      if (end.getTime() > endOfDay.getTime()) {
        end.setTime(endOfDay.getTime());
        start.setTime(end.getTime());
        start.setMinutes(start.getMinutes() - durationMin);
      }

      timeSlotStore.updateTimeSlot(
        event.timeSlotId,
        { start: start, end: end },
        "Termin verschieben"
      );
    }
    // Vue-Cal soll nichts selbst ändern - Store ist Source of Truth
    return false;
  }

  /**
   * Wird bei jedem Schritt während des Resizens aufgerufen.
   * Lehnt Schritte ab, bei denen das Event vor 8 Uhr beginnt oder kürzer als die Mindestdauer ist,
   * vue-cal behält dann den letzten gültigen Stand.
   *
   * @param Objekt - Objekt mit:
   *  - event: das Event mit den neuen Zeiten
   * @returns false, wenn der Schritt abgelehnt wird
   */
  function isValidResize({ event }: { event: VueCalEvent }): boolean {
    const earliestStart = new Date(event.start);
    earliestStart.setHours(minStartHours, 0, 0, 0);
    const durationMs = event.end.getTime() - event.start.getTime();
    return event.start >= earliestStart && durationMs >= minDurationMinutes * 60 * 1000;
  }

  /**
   * Wird ausgelöst, wenn ein Event in vue-cal in der Höhe verändert wurde.
   * Die Zeiten wurden bereits in isValidResize geprüft.
   *
   * @param Objekt - Objekt mit:
   *  - event: das veränderte VueCalEvent
   */
  function onEventResize({ event }: { event: VueCalEvent }) {
    timeSlotStore.updateTimeSlot(
      event.timeSlotId,
      { start: new Date(event.start), end: new Date(event.end) },
      "Dauer ändern"
    );
    // Kein `false`: Sonst setzt vue-cal das Event nach diesem Handler auf die alte Zeit zurück.
    // vue-cal übernimmt dieselben Zeiten wie der Store, bei einem API-Fehler setzt der Rollback beide zurück.
  }
</script>
