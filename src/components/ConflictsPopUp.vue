<template>
  <b-modal v-model="show" title="Ressourcen-Konflikte" size="md" scrollable>
    <template #footer><div></div></template>

    <search-bar @new-search="searchConflicts" />

    <div class="d-flex justify-content-center gap-4">
      <b-button-group size="sm" class="mt-2">
        <b-button
          :variant="selectedResourceType === '' ? 'secondary' : 'outline-secondary'"
          @click="selectedResourceType = ''"
        >
          Alles
        </b-button>
        <b-button
          :variant="selectedResourceType === 'lecturer' ? 'secondary' : 'outline-secondary'"
          @click="selectedResourceType = 'lecturer'"
        >
          <user />
        </b-button>
        <b-button
          :variant="selectedResourceType === 'study_group' ? 'secondary' : 'outline-secondary'"
          @click="selectedResourceType = 'study_group'"
        >
          <users />
        </b-button>
        <b-button
          :variant="selectedResourceType === 'room' ? 'secondary' : 'outline-secondary'"
          @click="selectedResourceType = 'room'"
          style="min-width: 60px"
        >
          <school />
        </b-button>
      </b-button-group>

      <b-button-group size="sm" class="mt-2">
        <b-button
          :variant="selectedStatus === '' ? 'secondary' : 'outline-secondary'"
          @click="selectedStatus = ''"
        >
          Alle
        </b-button>
        <b-button
          :variant="selectedStatus === 'active' ? 'secondary' : 'outline-secondary'"
          @click="selectedStatus = 'active'"
        >
          Aktiv
        </b-button>
        <b-button
          :variant="selectedStatus === 'ignored' ? 'secondary' : 'outline-secondary'"
          @click="selectedStatus = 'ignored'"
        >
          Ignoriert
        </b-button>
      </b-button-group>
    </div>

    <div
      class="no-conflict-message"
      v-if="conflictDisplay.length === 0 && labEngineerOnlyDisplay.length === 0"
    >
      Keine Konflikte vorhanden
    </div>

    <div
      v-for="violation in labEngineerOnlyDisplay"
      :key="`lab-engineer-only-${violation.courseId}`"
      class="mt-2 mb-1 p-3 border rounded d-flex justify-content-between align-items-center"
    >
      <div :class="{ 'opacity-50': !violation.active }">
        <div class="d-flex align-items-center gap-2">
          <calendar :size="20" />
          {{ violation.course }}
        </div>
        <div class="d-flex align-items-center gap-2">
          <flask-conical :size="20" />
          {{ violation.message }}
        </div>
      </div>

      <div class="d-flex align-items-center gap-3">
        <calendar-search-button
          :size="32"
          :ignored="!violation.active"
          @click="openLabEngineerView(violation.courseId)"
        />

        <b-form-checkbox
          switch
          :model-value="violation.active"
          @update:model-value="
            () =>
              conflictStore.setCourseLecturerViolationIgnored(violation.courseId, violation.active)
          "
          size="lg"
          class="opacity-100"
        >
        </b-form-checkbox>
      </div>
    </div>

    <div
      v-for="conflict in conflictDisplay"
      :key="conflict.id"
      class="mt-2 mb-1 p-3 border rounded d-flex justify-content-between align-items-center"
    >
      <div :class="{ 'opacity-50': !conflict.active }">
        <div class="d-flex align-items-center gap-2">
          <calendar :size="20" />
          {{ conflict.courseA }} & {{ conflict.courseB }}
        </div>
        <div class="d-flex align-items-center gap-2">
          <user :size="20" v-if="conflict.resourceType === 'lecturer'" />
          <users :size="20" v-if="conflict.resourceType === 'study_group'" />
          <school :size="20" v-if="conflict.resourceType === 'room'" />
          {{ conflict.resource }}
        </div>
        <div class="d-flex align-items-center gap-2">
          <clock :size="20" />
          {{ conflict.time }}
        </div>
      </div>

      <div class="d-flex align-items-center gap-3">
        <calendar-search-button
          :size="32"
          :ignored="!conflict.active"
          @click="openConflictView(conflict)"
        />

        <b-form-checkbox
          switch
          :model-value="conflict.active"
          @update:model-value="() => toggleConflict(conflict)"
          size="lg"
          class="opacity-100"
        >
        </b-form-checkbox>
      </div>
    </div>
  </b-modal>
</template>

<script setup lang="ts">
  import type {
    IgnoredResourceConflict,
    ResourceConflict,
    ResourceConflictDisplay,
    ResourceType,
  } from "@/models/ResourceConflict";
  import { useCourseStore } from "@/stores/courseStore";
  import { useResourceConflictStore } from "@/stores/resourceConflictsStore";
  import { useTimeSlotStore } from "@/stores/timeSlotStore";
  import { BModal, BFormCheckbox, BButtonGroup, BButton } from "bootstrap-vue-next";
  import { computed, nextTick, ref, type ComputedRef } from "vue";
  import SearchBar from "./SearchBar.vue";
  import CalendarSearchButton from "./IconButtons/CalendarSearchButton.vue";
  import { Calendar, Clock, FlaskConical, School, User, Users } from "lucide-vue-next";
  import { useViewStore } from "@/stores/viewStore";
  import { LecturerKind } from "@/enums/enums";

  const conflictStore = useResourceConflictStore();
  const timeSlotStore = useTimeSlotStore();
  const courseStore = useCourseStore();
  const viewStore = useViewStore();
  const show = defineModel<boolean>();

  const query = ref<string>("");
  const selectedResourceType = ref<ResourceType | "">("");
  const selectedStatus = ref<"active" | "ignored" | "">("");

  const conflictDisplay: ComputedRef<ResourceConflictDisplay[]> = computed(() => {
    const active = conflictStore.resourceConflictsList.map(c => mapConflictForDisplay(c));
    const ignored = conflictStore.ignoredResourceConflictsList.map(c =>
      mapIgnoredConflictForDisplay(c)
    );

    let conflicts;

    if (selectedStatus.value === "active") {
      conflicts = [...active];
    } else if (selectedStatus.value === "ignored") {
      conflicts = [...ignored];
    } else {
      conflicts = [...active, ...ignored];
    }

    if (selectedResourceType.value !== "") {
      conflicts = conflicts.filter(c => c.resourceType === selectedResourceType.value);
    }

    const displayedConflicts =
      query.value.length === 0 ? conflicts : conflicts.filter(c => matchesQuery(c));

    return displayedConflicts;
  });

  // Veranstaltungen, denen nur Laboringenieure zugewiesen sind (Filter: Lehrperson)
  const labEngineerOnlyDisplay = computed(() => {
    if (selectedResourceType.value !== "" && selectedResourceType.value !== "lecturer") return [];
    const message = (count: number) =>
      count === 1
        ? "Nur ein Laboringenieur, keine weitere Lehrperson"
        : `Nur ${count} Laboringenieure, keine weitere Lehrperson`;

    const active = conflictStore.courseLecturerViolations.map(v => {
      const course = courseStore.courseMap.get(v.courseId);
      return {
        courseId: v.courseId,
        course: `${v.number}_${course?.abbreviation ?? v.name}`,
        name: v.name,
        message: message(v.labEngineerCount),
        active: true,
      };
    });
    // ohne Fehlermeldung: die Veranstaltung kann gerade gelöscht worden sein
    const ignored = conflictStore.ignoredCourseLecturerViolations.flatMap(courseId => {
      const course = courseStore.courseMap.get(courseId);
      if (!course) return [];
      const labEngineers = course.lecturers.filter(l => l.kind === LecturerKind.LAB_ENGINEER);
      return [
        {
          courseId,
          course: `${course.number}_${course.abbreviation}`,
          name: course.name,
          message: message(labEngineers.length),
          active: false,
        },
      ];
    });

    let violations;
    if (selectedStatus.value === "active") {
      violations = active;
    } else if (selectedStatus.value === "ignored") {
      violations = ignored;
    } else {
      violations = [...active, ...ignored];
    }

    return violations.filter(
      v =>
        query.value.length === 0 ||
        v.course.toLowerCase().includes(query.value) ||
        v.name.toLowerCase().includes(query.value)
    );
  });

  function matchesQuery(conflict: ResourceConflictDisplay) {
    if (
      conflict.courseA.toLowerCase().includes(query.value) ||
      conflict.courseB.toLowerCase().includes(query.value) ||
      conflict.resource.toLowerCase().includes(query.value)
    ) {
      return true;
    } else {
      return false;
    }
  }

  function toggleConflict(conflict: ResourceConflictDisplay) {
    if (conflict.active) {
      conflictStore.ignoreConflict(conflict.id);
    } else {
      conflictStore.unignoreConflict(conflict.id);
    }
  }

  function mapConflictForDisplay(conflict: ResourceConflict): ResourceConflictDisplay {
    const courseA = courseStore.readCourse(conflict.slotACourse);
    const courseB = courseStore.readCourse(conflict.slotBCourse);
    const display: ResourceConflictDisplay = {
      id: conflictStore.getKey(conflict),
      courseA: `${courseA !== undefined ? `${courseA.number}_${courseA.abbreviation}` : "-"}`,
      courseB: `${courseB !== undefined ? `${courseB.number}_${courseB.abbreviation}` : "-"}`,
      resourceType: conflict.resourceType,
      resourceId: conflict.resourceId,
      resourceLabel: conflictStore.getResourceTypeString(conflict.resourceType),
      resource: conflictStore.getResourceDisplayString(conflict.resourceType, conflict.resourceId),
      time: getRelevantTimeFrame(conflict.slotA, conflict.slotB),
      active: true,
    };
    return display;
  }

  function mapIgnoredConflictForDisplay(
    conflict: IgnoredResourceConflict
  ): ResourceConflictDisplay {
    // ohne Fehlermeldung: der Termin kann gerade gelöscht worden sein
    const courseOf = (slotId: number) =>
      courseStore.courseMap.get(timeSlotStore.timeSlotCourseAssignmentsMap.get(slotId) ?? -1);
    const courseA = courseOf(conflict.slotA);
    const courseB = courseOf(conflict.slotB);
    const display: ResourceConflictDisplay = {
      id: conflictStore.getKey(conflict),
      courseA: `${courseA !== undefined ? `${courseA.number}_${courseA.abbreviation}` : "-"}`,
      courseB: `${courseB !== undefined ? `${courseB.number}_${courseB.abbreviation}` : "-"}`,
      resourceType: conflict.resourceType,
      resourceId: conflict.resourceId,
      resourceLabel: conflictStore.getResourceTypeString(conflict.resourceType),
      resource: conflictStore.getResourceDisplayString(conflict.resourceType, conflict.resourceId),
      time: getRelevantTimeFrame(conflict.slotA, conflict.slotB),
      active: false,
    };
    return display;
  }

  function getRelevantTimeFrame(slotA: number, slotB: number): string {
    const timeSlotA = timeSlotStore.readTimeSlot(slotA);
    const timeSlotB = timeSlotStore.readTimeSlot(slotB);
    if (timeSlotA === undefined || timeSlotB === undefined) return "-";
    const start = new Date(Math.max(timeSlotA.start.getTime(), timeSlotB.start.getTime()));
    const end = new Date(Math.min(timeSlotA.end.getTime(), timeSlotB.end.getTime()));
    return `${start.toLocaleDateString("de-DE", { weekday: "long" })} ${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")} - ${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
  }

  function searchConflicts(searchText: string) {
    query.value = searchText.trim().toLowerCase();
  }

  function openConflictView(conflict: ResourceConflictDisplay) {
    viewStore.openConflict(conflict.resourceType, conflict.resourceId);
    show.value = false;
  }

  /**
   * Öffnet die Ansicht des (ersten) Laboringenieurs einer Veranstaltung und lässt deren Termine aufleuchten.
   *
   * @param courseId - ID der Veranstaltung
   */
  async function openLabEngineerView(courseId: number) {
    const course = courseStore.courseMap.get(courseId);
    const labEngineer = course?.lecturers.find(l => l.kind === LecturerKind.LAB_ENGINEER);
    if (!course || !labEngineer) return;
    show.value = false;
    await viewStore.openConflict("lecturer", labEngineer.id);
    // erst nach dem Rendern der neuen Termine, sonst verpassen sie das Aufleuchten
    await nextTick();
    if (course.timeSlots.length > 0) courseStore.highlightCourse(courseId);
  }
</script>

<style scoped lang="css">
  .no-conflict-message {
    margin: 100px 0;
    text-align: center;
  }

  .tab-content {
    max-height: 400px;
    overflow-y: auto;
  }
</style>
