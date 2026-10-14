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
  import type { Course } from "@/models/Course";
  import type { VueCalEvent } from "@/models/VueCalEvent";
  import { useCourseStore } from "@/stores/courseStore";
  import { useTimeSlotStore } from "@/stores/timeSlotStore";
  import { computed, onMounted, ref, watch } from "vue";
  import { Tab } from "@/enums/enums";
  import { useColor } from "@/composables/useColor";
  import { BPopover } from "bootstrap-vue-next";
  import ColorBox from "./ColorBox.vue";
  import { School, User, Users } from "lucide-vue-next";
  import { useResourceConflictStore } from "@/stores/resourceConflictsStore";
  import type { ResourceConflict } from "@/models/ResourceConflict";
  import { useSettingsStore } from "@/stores/settingsStore";
  import { useQueryParameters } from "@/composables/useQueryParameters";
  import CalendarSearchButton from "./IconButtons/CalendarSearchButton.vue";

  const courseStore = useCourseStore();
  const timeSlotStore = useTimeSlotStore();
  const conflictStore = useResourceConflictStore();
  const settingsStore = useSettingsStore();
  const queryParams = useQueryParameters();
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

  const event = ref(props.event);
  const course = ref<Course | undefined>();

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

  const hasConflict = computed(() => {
    if (event.value.conflicts === undefined) return false;
    if (event.value.conflicts.length === 0) return false;
    return true;
  });

  onMounted(() => {
    if (props.event.courseId !== undefined)
      course.value = courseStore.readCourse(props.event.courseId);
  });

  // Lässt das Event kurz aufleuchten, wenn in der Sidebar das Kalender-Icon des zugehörigen Kurses angeklickt wurde.
  const isBlinking = ref(false);
  let blinkTimeout: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => courseStore.highlightTrigger,
    () => {
      if (courseStore.highlightedCourseId !== props.event.courseId) return;
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

  /**Kann nur Schwarz oder weiß sein, Bedingung ist nur zum Testen */
  const fontColor = computed(() => {
    if (event.value.backgroundColor === undefined) {
      return black;
    }
    if (event.value.backgroundColor === "") {
      return black;
    }
    const backgroundColor = event.value.backgroundColor;
    return calculateFontColor(backgroundColor);
  });

  const blinkColor = computed(() => {
    const bg = event.value.backgroundColor ?? black;
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
   * den Konflikt verursacht.
   *
   * @param conflict - Ressourcenkonlikt
   */
  function openView(conflict: ResourceConflict) {
    const tab = settingsStore.resourceTypeToTab(conflict.resourceType);
    const url = queryParams.getConflictUrl(tab, conflict.resourceId);

    window.location.assign(url);
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
