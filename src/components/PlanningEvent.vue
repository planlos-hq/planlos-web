<template>
  <b-popover
    hover
    :delay="{ show: 500, hide: 50 }"
    lazy
    unmount-lazy
    teleport-to="body"
    placement="right"
    body-class="p-1"
    no-animation
  >
    <template #target>
      <div
        class="planning-event"
        :class="{ blink: isBlinking }"
        @click="emit('click')"
        :style="{
          color: fontColor,
          '--blink-color': blinkColor,
          borderBottom: hasConflict ? `10px solid ${fontColor}` : 'none',
        }"
      >
        <p class="name p-0 m-0">{{ course?.abbreviation ?? event.title }}</p>
        <p v-for="detail in details" :key="detail" class="detail p-0 m-0">{{ detail }}</p>
      </div>
    </template>
    <div class="d-flex flex-column">
      <p class="m-0 p-0 small-text">{{ event.title }}</p>
      <p class="p-0 m-0 small-text">{{ formatTime(event.start) }} - {{ formatTime(event.end) }}</p>
      <div v-if="course?.color" class="d-flex flex-row gap-2 align-items-center">
        <color-box :hex="course.color.hex" :button="false" :size="15" />
        <p class="m-0 p-0 small-text">{{ course.color.name }}</p>
      </div>

      <p class="m-0 mt-1 p-0 small-text" v-if="hasConflict">Konflikte:</p>
      <div v-if="event.labEngineerOnly" class="mt-1 mb-1 super-small-text">
        <flask-conical :size="20" />
        Nur Laboringenieur, keine weitere Lehrperson
      </div>
      <div
        v-for="(conflict, index) in event.conflicts"
        :key="index"
        class="mt-1 mb-1 d-flex justify-content-between align-items-center super-small-text"
      >
        <div>
          <user :size="20" v-if="conflict.resourceType === 'lecturer'" />
          <users :size="20" v-if="conflict.resourceType === 'study_group'" />
          <school :size="20" v-if="conflict.resourceType === 'room'" />
          {{ conflictStore.getResourceDisplayString(conflict.resourceType, conflict.resourceId) }}
        </div>
        <calendar-search-button
          :ignored="false"
          :size="20"
          @click="openView(conflict)"
          class="ms-2 me-2"
        />
      </div>
    </div>
  </b-popover>
</template>

<script setup lang="ts">
  import type { VueCalEvent } from "@/models/VueCalEvent";
  import { useCourseStore } from "@/stores/courseStore";
  import { useTimeSlotStore } from "@/stores/timeSlotStore";
  import { computed, nextTick, ref, watch } from "vue";
  import { Tab } from "@/enums/enums";
  import { useColor } from "@/composables/useColor";
  import { BPopover } from "bootstrap-vue-next";
  import ColorBox from "./ColorBox.vue";
  import { FlaskConical, School, User, Users } from "lucide-vue-next";
  import { useResourceConflictStore } from "@/stores/resourceConflictsStore";
  import type { ResourceConflict } from "@/models/ResourceConflict";
  import { useViewStore } from "@/stores/viewStore";
  import CalendarSearchButton from "./IconButtons/CalendarSearchButton.vue";

  const courseStore = useCourseStore();
  const timeSlotStore = useTimeSlotStore();
  const conflictStore = useResourceConflictStore();
  const viewStore = useViewStore();
  const { calculateFontColor } = useColor();

  const black = "#000000";

  const props = withDefaults(
    defineProps<{
      /**aktuelles Kalenderevent */
      event: VueCalEvent;
      /**aktuell ausgewählter Tab - bestimmt, welche Infos angezeigt werden */
      filterType?: Tab;
    }>(),
    { filterType: Tab.COURSE }
  );

  const emit = defineEmits<{
    /**Wird ausgelöst, wenn das Event angeklickt wurde */
    click: [void];
  }>();

  const course = computed(() => courseStore.courseMap.get(props.event.courseId));

  const hasConflict = computed(
    () => props.event.conflicts.length > 0 || props.event.labEngineerOnly
  );

  const details = computed(() => {
    if (!course.value) return [];
    const lecturers = course.value.lecturers.map(l => l.abbreviation).join(", ");
    const groups = course.value.studyGroups
      .map(
        s =>
          `${s.degreeProgram.abbreviation}${s.semesterYear % 100}_${s.semesterSeason
            .charAt(0)
            .toUpperCase()}`
      )
      .join(", ");
    const timeSlot = timeSlotStore.readTimeSlot(props.event.timeSlotId);
    const rooms = timeSlot?.rooms.map(r => r.number).join(", ") ?? "";

    switch (props.filterType) {
      case "lecturer":
        return [rooms, groups];
      case "room":
        return [groups, lecturers];
      default:
        return [rooms, lecturers];
    }
  });

  // Lässt das Event kurz aufleuchten, wenn in der Sidebar das Kalender-Icon des zugehörigen Kurses
  // oder bei einem Konflikt das Kalender-Such-Icon angeklickt wurde.
  const isBlinking = ref(false);
  let blinkTimeout: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => courseStore.highlightTrigger,
    () => {
      const highlighted =
        courseStore.highlightedCourseId === props.event.courseId ||
        courseStore.highlightedTimeSlotIds.includes(props.event.timeSlotId);
      if (!highlighted) return;
      isBlinking.value = false;
      requestAnimationFrame(() => {
        isBlinking.value = true;
      });
      clearTimeout(blinkTimeout);
      blinkTimeout = setTimeout(() => {
        isBlinking.value = false;
      }, 1400);
    }
  );

  /** Schriftfarbe ist immer Schwarz oder Weiß, je nach Hintergrund */
  const fontColor = computed(() => {
    const bg = props.event.backgroundColor;
    if (bg === undefined || bg === "") return black;
    return calculateFontColor(bg);
  });

  const blinkColor = computed(() => {
    const bg = props.event.backgroundColor ?? black;
    return `color-mix(in srgb, ${bg}, ${calculateFontColor(bg)} 45%)`;
  });

  /**
   * Formatiert ein Datum zu Stunden und Minuten im deutschen Format.
   * @param date - Das zu formatierende Datum
   * @returns formatiertes Zeit-String, z.B. "14:30"
   */
  function formatTime(date: Date) {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Öffnet im aktuellen Tab die Ansicht der spezifischen Ressource, die
   * den Konflikt verursacht, und lässt die beiden Termine des Konflikts aufleuchten.
   *
   * @param conflict - Ressourcenkonlikt
   */
  async function openView(conflict: ResourceConflict) {
    await viewStore.openConflict(conflict.resourceType, conflict.resourceId);
    // erst nach dem Rendern der neuen Termine, sonst verpassen sie das Aufleuchten
    await nextTick();
    courseStore.highlightTimeSlots([conflict.slotA, conflict.slotB]);
  }
</script>

<style scoped>
  .planning-event {
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
    position: relative;
  }

  .planning-event.blink {
    animation: event-blink 0.45s ease-in-out 3;
  }

  @keyframes event-blink {
    0%,
    100% {
      background-color: transparent;
    }

    50% {
      background-color: var(--blink-color);
    }
  }

  .time {
    margin: 0;
    padding-right: 32px;
  }

  .name {
    font-size: 1.3em;
    font-weight: 700;
    margin: 0;
    padding-right: 32px;
    word-break: break-all;
  }

  .paint-icon {
    bottom: 1%;
    position: absolute;
    right: 1%;
  }

  .small-text {
    font-size: small;
  }

  .super-small-text {
    font-size: x-small;
  }
</style>
