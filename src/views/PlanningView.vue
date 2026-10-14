<template>
  <base-layout>
    <template #sidebar>
      <side-bar @on-event-drag-start="onEventDragStart" />
    </template>
    <template #content>
      <vue-cal
        :key="plannerSettings.tab"
        v-bind="timetableConfig"
        :schedules="calendarSchedules"
        :events="events"
        :hide-weekdays="plannerSettings.hiddenWeekdays"
        :special-hours="breaks"
        @event-drop="onEventDrop"
        @event-resize-end="onEventResize"
      >
        <template #event="{ event }">
          <planning-event
            :event="event"
            :filter-type="plannerSettings.tab"
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
  import { useRoomStore } from "@/stores/roomStore";
  import { useLecturerStore } from "@/stores/lecturerStore";
  import { Tab } from "@/enums/enums";
  import { handleUpdate } from "@/updates/handler.updates";
  import { useResourceConflictStore } from "@/stores/resourceConflictsStore";
  import { useQueryParameters } from "@/composables/useQueryParameters";
  import { useSettingsStore } from "@/stores/settingsStore";
  import { storeToRefs } from "pinia";
  import type { Color } from "@/models/Color";
  import ImpressumDialog from "@/components/ImpressumDialog.vue";
  import AboutDialog from "@/components/AboutDialog.vue";
  import HelpDialog from "@/components/HelpDialog.vue";

  const vueCalEventStore = useVueCalEventStore();
  const timeSlotStore = useTimeSlotStore();
  const courseStore = useCourseStore();
  const studyGroupStore = useStudyGroupStore();
  const roomStore = useRoomStore();
  const lecturerStore = useLecturerStore();
  const resourceConflictStore = useResourceConflictStore();
  const settingsStore = useSettingsStore();
  const { plannerSettings } = storeToRefs(settingsStore);

  const queryParams = useQueryParameters();

  const selectedEvent = ref<VueCalEvent | null>(null);
  const showEventOverview = ref<boolean>(false);

  /**
   * Setzt die Hintergrundfarbe des Events
   * @param color - Die ausgewählte Farbe
   */
  function paint(color: Color) {
    if (!selectedEvent.value) {
      return;
    }
    courseStore.updateCourse(selectedEvent.value.courseId, { color: color });
  }
  /**
   * Kümmert sich um den Klick auf ein Event im Kalender
   * @param event - Event aus VueCal, besteht aus e = JS Dom Event und event = clicked calender event
   */
  function handleEventClick(event: VueCalEvent) {
    selectedEvent.value = event;
    showEventOverview.value = true;
  }

  watch(
    plannerSettings,
    settings => {
      queryParams.setQueryParameters(settings);

      if (!settings.temp) {
        settingsStore.setLocalStorage(settings);
      }
    },
    { deep: true }
  );

  //Wenn ein Event entfernt wird, wird das EventOverview sofort geschlossen.
  watch(
    () => vueCalEventStore.vueCalEventsList,
    list => {
      if (!list.some(e => e.id === selectedEvent.value?.id)) {
        showEventOverview.value = false;
      }
    }
  );

  const calendarSchedules = computed(() => {
    if (plannerSettings.value.tab !== Tab.COURSE) return [];
    return studyGroupStore.schedules;
  });

  const breaks = computed(() => {
    return plannerSettings.value.showBreaks ? specialHours : {};
  });

  const events = computed(() => {
    if (plannerSettings.value.tab === Tab.COURSE) return vueCalEventStore.vueCalEventsList;

    let id: number | null = null;

    switch (plannerSettings.value.tab) {
      case Tab.LECTURER:
        id = lecturerStore.selectedLecturerId;
        break;
      case Tab.STUDYGROUP:
        id = studyGroupStore.selectedStudyGroupId;
        break;
      case Tab.ROOM:
        id = roomStore.selectedRoomId;
        break;
      case Tab.DEGREEPROGRAM:
        return [];
      default:
        return [];
    }
    if (id === null) return [];

    return vueCalEventStore.getFilteredEvents;
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
    course.timeSlots = course.timeSlots.filter(t => t.id !== event.timeSlotId);
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
    courseStore.selectCourse(item.id);
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
  function onEventDrop({ event, external }: { event: any; external: boolean }) {
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
      if (!course) {
        return;
      }
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
      if (!course) return;
      const timeSlot = timeSlotStore.readTimeSlot(event.timeSlotId);
      if (!timeSlot) return;
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

      timeSlotStore.updateTimeSlot(event.timeSlotId, { start: start, end: end });
    }
  }
  /**
   * Wird ausgelöst, wenn ein Event in vue-cal in der Höhe verändert wird.
   * Aktualisiert die Dauer (Start/Ende) des Timeslots im Store.
   * Events können frühsten 8 Uhr beginnen.
   *
   * @param Objekt - Objekt mit:
   *  - event: das veränderte VueCalEvent
   */
  function onEventResize({ event }: { event: VueCalEvent }) {
    // Wenn die Startzeit des Events vor um 8 ist, wird sie auf 8 Uhr gesetzt
    const start = new Date(event.start);
    if (start.getHours() < minStartHours) {
      start.setHours(minStartHours, 0, 0, 0);
    }

    let end = new Date(event.end);

    if (end.getTime() - start.getTime() <= 1000 * 60 * minDurationMinutes) {
      end = new Date(start);
      end.setMinutes(end.getMinutes() + minDurationMinutes);
    }

    const course = courseStore.readCourse(event.courseId);
    if (!course) return;
    timeSlotStore.updateTimeSlot(event.timeSlotId, { start: start, end: end });
  }
</script>
