<template>
  <time-table-settings
    v-model="showSettings"
    @close="showSettings = !showSettings"
    @open-import-export="showImportExportDialog = true"
  />
  <resource-dialog v-model="showCreateDialog" mode="create" :selected-tab="view.tab" />
  <resource-dialog v-model="showEditDialog" mode="edit" :selected-tab="view.tab" />
  <conflicts-pop-up v-model="showConflicts" />
  <share-settings-dialog v-model="showShareDialog" />
  <import-export-dialog v-model="showImportExportDialog" />

  <div class="sidebar-container">
    <div
      class="d-flex flex-row justify-content-center justify-content-evenly mt-3 mb-3 top-actions"
    >
      <add-button @click="showCreateDialog = true" :size="28" title="Hinzufügen" />
      <settings-button @click="showSettings = !showSettings" :size="28" title="Einstellungen" />
      <conflict-warning-button
        @click="showConflicts = true"
        :size="28"
        :conflict-count="conflictStore.resourceConflictsList.length"
        title="Konflikte anzeigen"
      />
      <share-button :size="28" @click="showShareDialog = true" title="Ansicht teilen" />
    </div>

    <div class="temp-container" v-if="view.temp">
      <div class="temp-info">
        <info class="temp-icon" style="height: 1.125rem; width: 1.125rem" />

        <span class="temp-text"> Temporäre Ansicht </span>
      </div>

      <div class="temp-actions">
        <b-button
          variant="primary"
          size="sm"
          class="d-flex align-items-center gap-2"
          @click="viewStore.keepTemp()"
        >
          <save style="height: 1.125rem; width: 1.125rem" />
          Übernehmen
        </b-button>

        <b-button
          variant="outline-secondary"
          size="sm"
          class="d-flex align-items-center gap-2"
          @click="viewStore.discardTemp()"
        >
          <rotate-ccw style="height: 1.125rem; width: 1.125rem" />
          Zurückspringen
        </b-button>
      </div>
    </div>

    <div class="d-flex flex-row justify-content-center justify-content-evenly mb-3 panel">
      <planning-button
        @click="selectTab(Tab.COURSE)"
        :size="20"
        :class="{ selected: view.tab === Tab.COURSE }"
        :title="'Veranstaltungen'"
      />
      <lecturer-button
        @click="selectTab(Tab.LECTURER)"
        :size="20"
        :class="{ selected: view.tab === Tab.LECTURER }"
        :title="'Lehrpersonen'"
      />
      <study-group-button
        @click="selectTab(Tab.STUDYGROUP)"
        :size="20"
        :class="{ selected: view.tab === Tab.STUDYGROUP }"
        :title="'Semestergruppen'"
      />
      <degree-programm-button
        @click="selectTab(Tab.DEGREEPROGRAM)"
        :size="20"
        :class="{ selected: view.tab === Tab.DEGREEPROGRAM }"
        :title="'Studiengänge'"
      />
      <room-button
        @click="selectTab(Tab.ROOM)"
        :size="20"
        :class="{ selected: view.tab === Tab.ROOM }"
        :title="'Räume'"
      />
    </div>

    <div class="d-flex flex-row justify-content-center pb-2 mt-0 ms-3 fw-bold">
      {{ title }}

      <toggle-all-button
        class="ms-2"
        v-if="view.tab === Tab.COURSE && viewStore.studyGroups.length > 0"
        :size="24"
        v-model="showAllCourses"
      />
    </div>

    <div class="list-detail-container">
      <div class="list-pane">
        <list-with-search
          :items="listItems"
          :draggable="planning"
          :searchable-text="listItem => getDisplayName(listItem)"
          :sort-options="sortOptions"
          :show-sort-toolbar="true"
          @on-event-drag-start="onEventDragStart"
          @select="handleSelect"
          :selected-id="selectedId"
        >
          <template #listElement="{ item }">
            <div v-if="view.tab === Tab.COURSE && isCourse(item)" class="course-item">
              <div class="course-text">
                <p class="m-0">{{ item.number }} - {{ item.abbreviation }}</p>
                <p class="m-0">{{ item.name }}</p>
              </div>
              <div
                class="plan-indicator"
                :class="{
                  unplanned: item.timeSlots.length === 0,
                  clickable: item.timeSlots.length > 0,
                }"
                @click.stop="item.timeSlots.length > 0 && courseStore.highlightCourse(item.id)"
              >
                <calendar-x v-if="item.timeSlots.length === 0" :size="20" />
                <template v-else>
                  <calendar-check :size="20" />
                  <span class="plan-count">{{ item.timeSlots.length }}</span>
                </template>
              </div>
            </div>
            <div v-else>
              {{ getDisplayName(item) }}
            </div>
          </template>
        </list-with-search>
      </div>

      <div
        class="detail-pane m-2"
        :class="{ 'detail-pane-collapsed': detailCollapsed }"
        v-if="selectedItem && selectedItem !== null"
      >
        <div class="detail-header">
          <button
            type="button"
            class="collapse-handle"
            @click="detailCollapsed = !detailCollapsed"
            :title="detailCollapsed ? 'Aufklappen' : 'Einklappen'"
          >
            <chevron-up v-if="detailCollapsed" :size="20" />
            <chevron-down v-else :size="20" />
          </button>
          <div class="detail-actions">
            <edit-button
              v-if="selectedId"
              class="edit-action"
              @click="showEditDialog = true"
              :size="32"
            ></edit-button>
            <delete-button
              v-if="selectedId"
              class="delete-action"
              @click="deleteDialog = true"
              :size="32"
            ></delete-button>
          </div>
        </div>
        <div class="detail-collapsible" :class="{ collapsed: detailCollapsed }">
          <div class="detail-collapsible-inner">
            <resource-information :resource="selectedItem" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <delete-dialog
    v-model="deleteDialog"
    v-if="selectedId && selectedItem && selectedItem !== null"
    @confirm="handleDelete(selectedId)"
  >
    <resource-information :resource="selectedItem" />
  </delete-dialog>
</template>

<script setup lang="ts">
  import type { Course } from "@/models/Course";
  import { useCourseStore } from "@/stores/courseStore";
  import { computed, ref } from "vue";
  import ListWithSearch from "@/components/ListWithSearch.vue";
  import TimeTableSettings from "./TimeTableSettings.vue";
  import SettingsButton from "./IconButtons/SettingsButton.vue";
  import AddButton from "./IconButtons/AddButton.vue";
  import { BButton, BFormCheckbox } from "bootstrap-vue-next";
  import ResourceDialog from "./ResourceDialog.vue";
  import { useLecturerStore } from "@/stores/lecturerStore";
  import { useRoomStore } from "@/stores/roomStore";
  import { useDegreeProgramStore } from "@/stores/degreeProgramStore";
  import { useStudyGroupStore } from "@/stores/studyGroupStore";
  import type { Lecturer } from "@/models/Lecturer";
  import type { Room } from "@/models/Room";
  import type { DegreeProgram } from "@/models/DegreeProgram";
  import type { StudyGroup } from "@/models/StudyGroup";
  import PlanningButton from "./IconButtons/PlanningButton.vue";
  import LecturerButton from "./IconButtons/LecturerButton.vue";
  import StudyGroupButton from "./IconButtons/StudyGroupButton.vue";
  import DegreeProgrammButton from "./IconButtons/DegreeProgrammButton.vue";
  import RoomButton from "./IconButtons/RoomButton.vue";
  import { Tab } from "@/enums/enums";
  import ResourceInformation from "./ResourceInformation.vue";
  import {
    isCourse,
    isDegreeProgram,
    isLecturer,
    isRoom,
    isStudyGroup,
  } from "@/models/CheckFunctions";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  import DeleteDialog from "./DeleteDialog.vue";
  import DeleteButton from "./IconButtons/DeleteButton.vue";
  import EditButton from "./IconButtons/EditButton.vue";
  import { storeToRefs } from "pinia";
  import ConflictWarningButton from "./IconButtons/ConflictWarningButton.vue";
  import { useResourceConflictStore } from "@/stores/resourceConflictsStore";
  import ConflictsPopUp from "./ConflictsPopUp.vue";
  import ShareSettingsDialog from "./ShareSettingsDialog.vue";
  import ShareButton from "./IconButtons/ShareButton.vue";
  import {
    CalendarCheck,
    CalendarX,
    ChevronDown,
    ChevronUp,
    Info,
    RotateCcw,
    Save,
  } from "lucide-vue-next";
  import { useViewStore } from "@/stores/viewStore";
  import type { SortOption } from "@/models/SortOptions";
  import ImportExportDialog from "./ImportExportDialog.vue";
  import ToggleAllButton from "./IconButtons/ToggleAllButton.vue";

  export type ListItem = Course | Lecturer | Room | DegreeProgram | StudyGroup;

  const deleteDialog = ref(false);
  const detailCollapsed = ref(false);

  const courseStore = useCourseStore();
  const lecturerStore = useLecturerStore();
  const roomStore = useRoomStore();
  const degreeProgramStore = useDegreeProgramStore();
  const studyGroupStore = useStudyGroupStore();
  const conflictStore = useResourceConflictStore();
  const viewStore = useViewStore();

  const { view } = storeToRefs(viewStore);

  const { lecturerList } = storeToRefs(lecturerStore);
  const { roomList } = storeToRefs(roomStore);
  const { degreeProgramList } = storeToRefs(degreeProgramStore);
  const { studyGroupList } = storeToRefs(studyGroupStore);

  const showAllCourses = ref(false);

  const courseList = computed(() => {
    if (viewStore.studyGroups.length === 0 || showAllCourses.value) {
      return courseStore.courseList;
    }
    return courseStore.courseList.filter(course =>
      course.studyGroups.some(group => viewStore.studyGroups.includes(group.id))
    );
  });

  const title = computed((): string => {
    switch (view.value.tab) {
      case Tab.LECTURER:
        return "Lehrpersonen";
      case Tab.STUDYGROUP:
        return "Semestergruppen";
      case Tab.DEGREEPROGRAM:
        return "Studiengänge";
      case Tab.ROOM:
        return "Räume";
      case Tab.COURSE:
        return "Veranstaltungen";
      default:
        return "Veranstaltungen";
    }
  });

  const planning = computed(() => view.value.tab === "course");

  function sortBy<T>(extract: (item: T) => string) {
    return (a: T, b: T) => extract(a).localeCompare(extract(b));
  }

  const sortOptions = computed<SortOption<ListItem>[]>(() => {
    switch (view.value.tab) {
      case Tab.COURSE:
        return [
          { label: "Name", comparator: sortBy<ListItem>(c => (isCourse(c) ? c.name : "")) },
          { label: "Nummer", comparator: sortBy<ListItem>(c => (isCourse(c) ? c.number : "")) },
          {
            label: "Abkürzung",
            comparator: sortBy<ListItem>(c => (isCourse(c) ? c.abbreviation : "")),
          },
        ];
      case Tab.LECTURER:
        return [
          {
            label: "Name",
            comparator: (a, b) => {
              if (!isLecturer(a) || !isLecturer(b)) return 0;
              const last = a.lastName.localeCompare(b.lastName);
              return last !== 0 ? last : a.firstName.localeCompare(b.firstName);
            },
          },
        ];
      case Tab.STUDYGROUP:
        return [
          {
            label: "Name",
            comparator: sortBy<ListItem>(g =>
              isStudyGroup(g)
                ? `${g.degreeProgram.abbreviation}${g.semesterYear % 100}_${g.semesterSeason
                    .charAt(0)
                    .toUpperCase()}`
                : ""
            ),
          },
        ];
      case Tab.DEGREEPROGRAM:
        return [
          {
            label: "Name",
            comparator: sortBy<ListItem>(d => (isDegreeProgram(d) ? d.name : "")),
          },
        ];
      case Tab.ROOM:
        return [
          {
            label: "Nummer",
            comparator: sortBy<ListItem>(r => (isRoom(r) ? r.number : "")),
          },
          {
            label: "Name",
            comparator: sortBy<ListItem>(r => (isRoom(r) ? r.name : "")),
          },
        ];
      default:
        return [];
    }
  });

  const listItems = computed<ListItem[]>(() => {
    switch (view.value.tab) {
      case Tab.LECTURER:
        return lecturerList.value;
      case Tab.STUDYGROUP:
        return studyGroupList.value;
      case Tab.DEGREEPROGRAM:
        return degreeProgramList.value;
      case Tab.ROOM:
        return roomList.value;
      case Tab.COURSE:
        return courseList.value;
      default:
        return [];
    }
  });

  const selectedItem = computed(() => {
    switch (view.value.tab) {
      case Tab.LECTURER:
        return lecturerStore.selectedLecturer;
      case Tab.STUDYGROUP:
        return studyGroupStore.selectedStudyGroup;
      case Tab.DEGREEPROGRAM:
        return degreeProgramStore.selectedDegreeProgram;
      case Tab.ROOM:
        return roomStore.selectedRoom;
      default:
        return courseStore.selectedCourse;
    }
  });

  /** Nur existierende Ressourcen gelten als ausgewählt, eine veraltete ID in der URL ergibt null */
  const selectedId = computed(() => selectedItem.value?.id ?? null);

  function handleSelect(id: number | null) {
    viewStore.select(view.value.tab, id);
  }

  function handleDelete(id: number) {
    switch (view.value.tab) {
      case Tab.LECTURER:
        lecturerStore.deleteLecturer(id);
        deleteDialog.value = false;
        break;
      case Tab.STUDYGROUP:
        studyGroupStore.deleteStudyGroup(id);
        deleteDialog.value = false;
        break;
      case Tab.DEGREEPROGRAM:
        degreeProgramStore.deleteDegreeProgram(id);
        deleteDialog.value = false;
        break;
      case Tab.ROOM:
        roomStore.deleteRoom(id);
        deleteDialog.value = false;
        break;
      case Tab.COURSE:
        courseStore.deleteCourse(id);
        deleteDialog.value = false;
        break;
    }
  }

  function getDisplayName(item: ListItem) {
    if (view.value.tab === Tab.COURSE && isCourse(item)) {
      return `${item.number} - ${item.abbreviation} ${item.name}`;
    }
    if (view.value.tab === Tab.LECTURER && isLecturer(item)) {
      return `${item.firstName.charAt(0)}. ${item.lastName}`;
    }
    if (view.value.tab === Tab.STUDYGROUP && isStudyGroup(item)) {
      return `${item.degreeProgram.abbreviation}${item.semesterYear % 100}_${item.semesterSeason.charAt(0).toUpperCase()}`;
    }
    if (view.value.tab === Tab.DEGREEPROGRAM && isDegreeProgram(item)) {
      return `${item.name}`;
    }
    if (view.value.tab === Tab.ROOM && isRoom(item)) {
      return `${item.number}: ${item.name}`;
    }
    return "";
  }

  const showSettings = ref(false);
  const showCreateDialog = ref(false);
  const showEditDialog = ref(false);
  const showConflicts = ref(false);
  const showShareDialog = ref(false);
  const showImportExportDialog = ref(false);

  const emit = defineEmits<{
    close: [void];
    onEventDragStart: [DragEvent, Course];
  }>();

  function onEventDragStart(event: DragEvent, item: Course) {
    emit("onEventDragStart", event, item);
  }

  function selectTab(tab: Tab) {
    viewStore.selectTab(tab);
  }
</script>

<style lang="css" scoped>
  .sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: 12px;
  }

  .list-detail-container {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
  }

  .list-pane {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-height: 2rem;
  }

  .detail-pane {
    background-color: #e6eeff;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    flex: 0 0 auto;
    padding: 10px;
    transition: padding 0.25s ease;
  }

  .detail-pane-collapsed {
    padding: 2px;
  }

  .detail-collapsible {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.25s ease;
  }

  .detail-collapsible.collapsed {
    grid-template-rows: 0fr;
  }

  .detail-collapsible-inner {
    overflow: hidden;
  }

  .detail-header {
    align-items: center;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }

  .detail-actions {
    display: flex;
    gap: 4px;
    grid-column: 3;
    justify-self: end;
  }

  .course-item {
    align-items: flex-start;
    display: flex;
    gap: 8px;
    justify-content: space-between;
  }

  .course-text {
    min-width: 0;
  }

  .plan-indicator {
    display: inline-flex;
    flex-shrink: 0;
    position: relative;
  }

  .plan-indicator.unplanned {
    color: var(--bs-danger);
  }

  .plan-indicator.clickable {
    cursor: pointer;
  }

  .plan-count {
    align-items: center;
    background-color: var(--button-color);
    border-radius: 50%;
    bottom: -6px;
    color: white;
    display: inline-flex;
    font-size: 0.6rem;
    font-weight: 600;
    height: 1rem;
    justify-content: center;
    line-height: 1;
    min-width: 1rem;
    padding: 0 0.2rem;
    position: absolute;
    right: -6px;
  }

  .collapse-handle {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    grid-column: 2;
    justify-self: center;
    padding: 2px;
  }

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  .detail-pane :deep(.icon-button) {
    padding: 8px;
  }
  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  .detail-pane :deep(.delete-action) {
    background-color: var(--bs-danger);
    color: white;
  }
  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  .detail-pane :deep(.delete-action:hover) {
    background-color: var(--bs-danger-border-subtle, #b02a37);
  }
  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  .detail-pane :deep(.edit-action) {
    background-color: var(--button-color);
    color: white;
  }
  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  .detail-pane :deep(.edit-action:hover) {
    background-color: var(--bs-secondary-border-subtle, #565e64);
  }

  .top-actions > * {
    align-items: center;
    border-radius: 10px;
    display: flex;
    height: 42px;
    justify-content: center;
    padding: 0;
    transition: all 0.2s ease;
    width: 42px;
  }

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  .top-actions :deep(.icon-button),
  .panel :deep(.icon-button) {
    border-radius: 10px;
  }

  .top-actions > *:not(:first-child):hover {
    background-color: var(--hover-color);
    cursor: pointer;
  }

  .panel {
    border-bottom: 1px solid var(--border-color);
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 10px;
    justify-content: center;
    padding: 10px 14px;
  }

  .panel > * {
    align-items: center;
    border-radius: 10px;
    display: flex;
    height: 34px;
    justify-content: center;
    padding: 0;
    transition: all 0.2s ease;
    width: 34px;
  }

  .panel .selected {
    background-color: var(--seleted-item-color);
    box-shadow: 0 2px 10px var(--seleted-item-color);
    transform: scale(1.2);
  }

  .panel > *:hover {
    background-color: var(--hover-color);
    cursor: pointer;
  }

  .temp-container {
    align-items: center;
    backdrop-filter: blur(4px);
    background: rgb(255 193 7 / 30%);
    border: 1px solid rgb(255 193 7 / 80%);
    border-radius: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 0.75rem;
    overflow: hidden;
    padding: 0.875rem 1rem;
  }

  .temp-info {
    align-items: center;
    display: flex;
    gap: 0.75rem;
  }

  .temp-icon {
    color: #f0ad4e;
    flex-shrink: 0;
  }

  .temp-text {
    font-weight: 600;
    line-height: 1;
  }

  .temp-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
</style>
