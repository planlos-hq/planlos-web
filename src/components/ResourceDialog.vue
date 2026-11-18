<template>
  <b-modal
    :title="title"
    size="md"
    ref="modal"
    scrollable
    @show="onShown"
    ok-only
    lazy
    unmount-lazy
  >
    <div
      class="d-flex flex-row justify-content-center justify-content-evenly mb-4 selector-panel"
      v-if="mode === 'create'"
    >
      <planning-button
        @click="selectResource(Tab.COURSE)"
        :size="20"
        :class="{ selected: selectedTab === Tab.COURSE }"
        :title="t('common.courses')"
      />
      <lecturer-button
        @click="selectResource(Tab.LECTURER)"
        :size="20"
        :class="{ selected: selectedTab === Tab.LECTURER }"
        :title="t('common.lecturers')"
      />
      <study-group-button
        @click="selectResource(Tab.STUDYGROUP)"
        :size="20"
        :class="{ selected: selectedTab === Tab.STUDYGROUP }"
        :title="t('common.studyGroups')"
      />
      <degree-programm-button
        @click="selectResource(Tab.DEGREEPROGRAM)"
        :size="20"
        :class="{ selected: selectedTab === Tab.DEGREEPROGRAM }"
        :title="t('common.degreePrograms')"
      />
      <room-button
        @click="selectResource(Tab.ROOM)"
        :size="20"
        :class="{ selected: selectedTab === Tab.ROOM }"
        :title="t('common.rooms')"
      />
    </div>

    <b-form @submit.prevent="handleSubmit">
      <b-form-group class="d-flex flex-column gap-2">
        <template v-for="object in activeConfig.attributes" :key="object.key">
          <!-- Nicht verfügbare Zeiten der Lehrperson stehen über "zur Planung aktiv" -->
          <lecturer-time-constraints
            v-if="selectedTab === Tab.LECTURER && object.key === 'isRelevant'"
            ref="timeConstraints"
            :lecturer-id="mode === 'edit' ? lecturerStore.selectedLecturer?.id : undefined"
          />
          <form-input
            :disabled="false"
            :type="object.type"
            :placeholder="object.placeholder"
            :required="object.required"
            :options="object.options"
            :is-item-selected="val => isItemSelected(val, formData[object.key] as any)"
            @toggle="id => object.storeRead && toggleItem(id, object.key, object.storeRead)"
            v-model="(formData as any)[object.key]"
            @edit="object.onEdit"
            @save="object.onSave"
            :show-save-button="object.showSaveButton"
          >
            <template #listItem="{ item }">
              {{ object.format ? object.format(item) : item }}
            </template>
          </form-input>
        </template>
        <div>
          <extra-resource-data v-model="(formData as BaseResource).extraData" />
        </div>
      </b-form-group>
      <button type="submit" ref="submitButton" style="display: none"></button>
    </b-form>

    <b-modal
      v-model="showDuplicateDialog"
      :title="t('resourceDialog.duplicateTitle')"
      centered
      :ok-title="t('resourceDialog.duplicateCreateAnyway')"
      ok-variant="primary"
      @ok="confirmCreateAnyway"
      no-animation
    >
      <i18n-t
        keypath="resourceDialog.duplicateExists"
        tag="p"
        :plural="duplicateCourses.length"
        :named="{ count: duplicateCourses.length }"
      >
        <template #number>
          <strong>{{ duplicateCourses[0]?.number }}</strong>
        </template>
      </i18n-t>
      <b-list-group class="mb-3">
        <b-list-group-item
          v-for="course in duplicateCourses"
          :key="course.id"
          class="duplicate-item"
        >
          {{ course.abbreviation }} – {{ course.name }}
        </b-list-group-item>
      </b-list-group>
      <p class="mb-0">{{ t("resourceDialog.duplicateConfirm") }}</p>
    </b-modal>

    <template #footer>
      <b-button @click="triggerSubmit" variant="primary" v-if="selectedTab">
        {{ mode === "create" ? t("common.save") : t("resourceDialog.applyChanges") }}
      </b-button>
    </template>

    <template-pop-up v-model="showTemplatePopUp" @on-close="closeTemplatePopUp" />
  </b-modal>
</template>

<script setup lang="ts">
  import { useResourceForm } from "@/composables/useResourceForm";
  import { useLecturerStore } from "@/stores/lecturerStore";
  import {
    BModal,
    BButton,
    BForm,
    BFormGroup,
    BListGroup,
    BListGroupItem,
  } from "bootstrap-vue-next";
  import { ref, computed, useTemplateRef, type ComputedRef, watch } from "vue";
  import { useI18n } from "vue-i18n";
  import FormInput, { type FormInputType, type SelectOption } from "./FormInput.vue";
  import type { Lecturer } from "@/models/Lecturer";
  import { useRoomStore } from "@/stores/roomStore";
  import type { Room } from "@/models/Room";
  import type { StudyGroup } from "@/models/StudyGroup";
  import { useStudyGroupStore } from "@/stores/studyGroupStore";
  import { useDegreeProgramStore } from "@/stores/degreeProgramStore";
  import { LecturerKind, lecturerKindKey, SemesterSeason } from "@/enums/enums";
  import type { DegreeProgram } from "@/models/DegreeProgram";
  import { useCourseStore } from "@/stores/courseStore";
  import type { Course } from "@/models/Course";
  import { Tab } from "@/enums/enums";
  import PlanningButton from "./IconButtons/PlanningButton.vue";
  import LecturerButton from "./IconButtons/LecturerButton.vue";
  import RoomButton from "./IconButtons/RoomButton.vue";
  import StudyGroupButton from "./IconButtons/StudyGroupButton.vue";
  import DegreeProgrammButton from "./IconButtons/DegreeProgrammButton.vue";
  import ExtraResourceData from "./ExtraResourceData.vue";
  import { useTemplateStore } from "@/stores/templateStore.ts";
  import { useViewStore } from "@/stores/viewStore";
  import type { StudyGroupTemplate } from "@/models/StudyGroupTemplate.ts";
  import TemplatePopUp from "./TemplatePopUp/TemplatePopUp.vue";
  import LecturerTimeConstraints from "./LecturerTimeConstraints.vue";

  type BaseResource = {
    id: number;
    extraData?: Record<string, string>;
  };

  type ResourceAttribute<T> = {
    key: keyof Omit<T, "id"> | "courses" | "templates" | "headings";
    placeholder: string;
    type: FormInputType;
    required: boolean;
    options?: ComputedRef<SelectOption[]> | ComputedRef<{ id: number }[]>;
    storeRead?: (id: number) => Lecturer | Room | StudyGroup | Course | undefined;
    // wird spezifisch in den einzelnen Fällen überprüft
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    format?: (item: any) => string;
    onEdit?: () => void;
    onSave?: () => void;
    showSaveButton?: boolean;
  };

  type ResourceConfig<T extends BaseResource> = {
    /** i18n-Key des Resourcennamens, z. B. "resourceDialog.lecturer" */
    titleKey: string;
    selectedResource: () => T | null | undefined;
    create: (item: Omit<T, "id">) => unknown;
    update: (id: number, updates: Partial<Omit<T, "id">>) => void | Promise<void>;
    select: (id: number | null) => void;
    delete: (id: number) => void | Promise<void>;
    fields: (keyof Omit<T, "id">)[];
    attributes: ResourceAttribute<T>[];
  };

  type ResourceConfigs = {
    lecturer: ResourceConfig<Lecturer>;
    room: ResourceConfig<Room>;
    studyGroup: ResourceConfig<StudyGroup>;
    degreeProgram: ResourceConfig<DegreeProgram>;
    course: ResourceConfig<Course>;
  };

  const props = defineProps<{
    /** Dient dazu herauszufinden, in welchem Modus die Komponente verwendet werden soll. */
    mode: "edit" | "create";
    /** Enthält den aktuellen Tab der SideBar. */
    selectedTab: Tab;
  }>();

  const { t } = useI18n();
  const selectedTab = ref<Tab>(props.selectedTab);
  const title = computed(() => createTitle());
  const submitButton = useTemplateRef("submitButton");
  const modal = useTemplateRef("modal");
  // Array, weil die Komponente in der v-for-Schleife der Felder steht
  const timeConstraints = useTemplateRef("timeConstraints");
  const showDuplicateDialog = ref(false);
  const duplicateCourses = ref<Course[]>([]);
  const showTemplatePopUp = ref<boolean>(false);

  const lecturerStore = useLecturerStore();
  const roomStore = useRoomStore();
  const studyGroupStore = useStudyGroupStore();
  const degreeProgramStore = useDegreeProgramStore();
  const courseStore = useCourseStore();
  const templateStore = useTemplateStore();
  const viewStore = useViewStore();

  watch(
    () => props.selectedTab,
    newValue => {
      selectedTab.value = newValue;
    }
  );

  const resourceConfigs = computed<ResourceConfigs>(() => ({
    lecturer: {
      titleKey: "resourceDialog.lecturer",
      selectedResource: () => lecturerStore.selectedLecturer,
      create: item => lecturerStore.createLecturer(item),
      update: (id, updates) => lecturerStore.updateLecturer(id, updates),
      select: id => viewStore.select(Tab.LECTURER, id),
      delete: id => lecturerStore.deleteLecturer(id),
      fields: ["firstName", "lastName", "abbreviation", "notes", "kind", "isRelevant", "extraData"],
      attributes: [
        {
          key: "firstName",
          placeholder: t("resourceDialog.firstName"),
          type: "text",
          required: true,
        },
        {
          key: "lastName",
          placeholder: t("resourceDialog.lastName"),
          type: "text",
          required: true,
        },
        {
          key: "abbreviation",
          placeholder: t("common.abbreviation"),
          type: "text",
          required: true,
        },
        { key: "notes", placeholder: t("common.notes"), type: "text-area", required: false },
        {
          key: "kind",
          placeholder: t("common.type"),
          type: "select",
          required: true,
          options: computed(() =>
            Object.values(LecturerKind).map(value => ({
              value: value,
              text: t(lecturerKindKey[value]),
            }))
          ),
        },
        {
          key: "isRelevant",
          placeholder: t("resourceInfo.activeForPlanning"),
          type: "checkbox",
          required: false,
        },
      ],
    },
    room: {
      titleKey: "resourceDialog.room",
      selectedResource: () => roomStore.selectedRoom,
      create: item => roomStore.createRoom(item),
      update: (id, updates) => roomStore.updateRoom(id, updates),
      select: id => viewStore.select(Tab.ROOM, id),
      delete: id => roomStore.deleteRoom(id),
      fields: ["number", "name", "seats", "extraData"],
      attributes: [
        {
          key: "number",
          placeholder: t("resourceDialog.roomNumber"),
          type: "text",
          required: true,
        },
        { key: "name", placeholder: t("resourceDialog.roomName"), type: "text", required: false },
        {
          key: "seats",
          placeholder: t("resourceDialog.seatsCount"),
          type: "number",
          required: false,
        },
      ],
    },
    studyGroup: {
      titleKey: "resourceDialog.studyGroup",
      selectedResource: () => studyGroupStore.selectedStudyGroup,
      create: item => studyGroupStore.createStudyGroup(item),
      update: (id, updates) => studyGroupStore.updateStudyGroup(id, updates),
      select: id => viewStore.select(Tab.STUDYGROUP, id),
      delete: id => studyGroupStore.deleteStudyGroup(id),
      fields: ["degreeProgram", "semesterSeason", "semesterYear", "studentCount", "extraData"],
      attributes: [
        {
          key: "degreeProgram",
          placeholder: t("common.degreeProgram"),
          type: "select",
          required: true,
          options: computed(() =>
            degreeProgramStore.degreeProgramList.map(degreeProgram => ({
              value: degreeProgram,
              text: degreeProgram.name,
            }))
          ),
        },
        {
          key: "semesterYear",
          placeholder: t("resourceInfo.year"),
          type: "number",
          required: true,
        },
        {
          key: "semesterSeason",
          placeholder: t("resourceInfo.semester"),
          type: "select",
          required: true,
          options: computed(() =>
            Object.values(SemesterSeason).map(value => ({
              value: value,
              text:
                value === SemesterSeason.SUMMER
                  ? t("resourceInfo.summer")
                  : t("resourceInfo.winter"),
            }))
          ),
        },
        {
          key: "studentCount",
          placeholder: t("resourceDialog.studentsCount"),
          type: "number",
          required: false,
        },
        {
          key: "headings",
          placeholder: t("resourceDialog.assignCoursesToGroup"),
          type: "heading",
          required: false,
        },
        {
          key: "templates",
          placeholder: t("resourceDialog.templatesForCourses"),
          type: "select-with-edit",
          required: false,
          options: computed(() =>
            templateStore.templateList.map(template => ({
              value: template,
              text: template.name,
            }))
          ),
          onEdit: () => {
            showTemplatePopUp.value = true;
          },
          onSave: () => saveCurrentCourses(),
          showSaveButton: props.mode === "edit",
        },
        {
          key: "courses",
          placeholder: t("resourceDialog.assignCourses"),
          type: "search-select",
          required: false,
          options: computed(() => courseStore.courseList),
          storeRead: courseStore.readCourse,
          format: (c: Course) => `${c.abbreviation} - ${c.name}`,
        },
      ],
    },
    degreeProgram: {
      titleKey: "common.degreeProgram",
      selectedResource: () => degreeProgramStore.selectedDegreeProgram,
      create: item => degreeProgramStore.createDegreeProgram(item),
      update: (id, updates) => degreeProgramStore.updateDegreeProgram(id, updates),
      select: id => viewStore.select(Tab.DEGREEPROGRAM, id),
      delete: id => degreeProgramStore.deleteDegreeProgram(id),
      fields: ["name", "abbreviation", "extraData"],
      attributes: [
        {
          key: "name",
          placeholder: t("resourceDialog.degreeProgramName"),
          type: "text",
          required: true,
        },
        {
          key: "abbreviation",
          placeholder: t("resourceDialog.degreeProgramAbbreviation"),
          type: "text",
          required: true,
        },
      ],
    },
    course: {
      titleKey: "resourceDialog.course",
      selectedResource: () => courseStore.selectedCourse,
      create: item => courseStore.createCourse(item),
      update: (id, updates) => courseStore.updateCourse(id, updates),
      select: id => viewStore.select(Tab.COURSE, id),
      delete: id => courseStore.deleteCourse(id),
      fields: [
        "number",
        "name",
        "abbreviation",
        "sws",
        "creditPoints",
        "lecturers",
        "studyGroups",
        "extraData",
      ],
      attributes: [
        {
          key: "number",
          placeholder: t("common.number"),
          type: "text",
          required: true,
        },
        {
          key: "name",
          placeholder: t("common.name"),
          type: "text",
          required: true,
        },
        {
          key: "abbreviation",
          placeholder: t("common.abbreviation"),
          type: "text",
          required: true,
        },
        {
          key: "sws",
          placeholder: "SWS",
          type: "number",
          required: false,
        },
        {
          key: "creditPoints",
          placeholder: "Credit Points",
          type: "number",
          required: false,
        },
        {
          key: "lecturers",
          placeholder: t("common.assignLecturers"),
          type: "search-select",
          required: false,
          options: computed(() => lecturerStore.relevantLecturers),
          storeRead: lecturerStore.readLecturer,
          format: (l: Lecturer) => `${l.firstName} ${l.lastName}`,
        },
        {
          key: "studyGroups",
          placeholder: t("resourceDialog.assignStudyGroups"),
          type: "search-select",
          required: false,
          options: computed(() => studyGroupStore.studyGroupList),
          storeRead: studyGroupStore.readStudyGroup,
          format: (s: StudyGroup) =>
            `${s.degreeProgram.abbreviation}${s.semesterYear % 100}_${s.semesterSeason.charAt(0).toUpperCase()}`,
        },
      ],
    },
  }));
  const activeConfig = computed(() => {
    return resourceConfigs.value[selectedTab.value as keyof ResourceConfigs];
  });

  const { formData, update, create, isItemSelected, toggleItem } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useResourceForm<any>(
      // Im Create-Modus startet das Formular leer, die Auswahl in der Ansicht bleibt unberührt
      () => (props.mode === "create" ? undefined : activeConfig.value.selectedResource()),
      () => activeConfig.value.fields, // Notwendig, da sich die Keys zur Laufzeit ändern
      (id, updates) => activeConfig.value.update(id, updates),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      item => (activeConfig.value.create as any)(item), // nötig, da sich Siganatur bei den Resourcen unterscheidet
      id => activeConfig.value.select(id),
      id => activeConfig.value.delete(id)
    );

  /**
   * Schauen, ob ein Template ausgewählt wurde und gegebenfalls die Kurse auswählen
   * Nur für Studiengruppen relevant.
   */
  watch(
    () => formData.value.templates,
    (newTemplate: StudyGroupTemplate | undefined) => {
      if (selectedTab.value !== Tab.STUDYGROUP) {
        return;
      }
      if (!newTemplate) {
        return;
      }

      const courses = [...newTemplate.courses];
      formData.value.courses = courses;
    },
    { deep: true }
  );

  /**
   * Vergleicht zwei Listen von Kursen, ob diese gleich sind
   * @param a - Liste a von Kursen
   * @param b - Liste b von Kursen
   */
  const areCoursesEqual = (a: Course[], b: Course[]): boolean => {
    if (a.length !== b.length) return false;
    const bIds = new Set(b.map(c => c.id));
    return a.every(c => bIds.has(c.id));
  };

  //Nur StudyGroupTemplates
  //Wenn der Nutzer eine Änderng der Kurse vorgenommen hat, dann soll das Template zurückgesetzt werden
  watch(
    () => formData.value.courses,
    (newCourses: Course[]) => {
      if (selectedTab.value !== Tab.STUDYGROUP) {
        return;
      }
      const template: StudyGroupTemplate | undefined = formData.value.templates;
      //Wenn der Nutzer Kurse gelöscht oder hinzugefügt hat, dann sind sie unterschiedlich
      if (template && !areCoursesEqual(template.courses, newCourses)) {
        formData.value.templates = undefined;
      }
    }
  );

  //Nur StudyGroups
  //Wenn eine Änderung eines Templates erfolgte, sollen bei aktiver Auswahl direkt die Kurse ausgewählt sein
  function closeTemplatePopUp() {
    showTemplatePopUp.value = false;
    formData.value.courses = (formData.value.templates as StudyGroupTemplate | undefined)
      ? [...formData.value.templates?.courses]
      : formData.value.courses;
  }

  //Nur StudyGroups
  /**
   * Erstellt einen Kurs anhand der vorhandenen Eingaben
   */
  function saveCurrentCourses() {
    templateStore.createTemplate({
      name: `${formData.value.degreeProgram.abbreviation}${formData.value.semesterYear % 100}_${formData.value.semesterSeason.charAt(0).toUpperCase()}`,
      courses: formData.value.courses,
    });
  }

  /**
   * Wählt eine Resource aus.
   * @param resource - Resource, die ausgewählt sein soll
   */
  function selectResource(resource: Tab) {
    selectedTab.value = resource;
  }

  /**
   * Klickt einen unsichtbaren Button, um Buttons aus dem Footer des Modals verwenden zu können.
   */
  function triggerSubmit() {
    submitButton.value?.click();
  }

  /**
   * Wird ausgeführt, wenn das Formular korrekt ist und abgeschickt werden soll.
   * Für den StudyGroup-Tab werden zusätzlich die Kurszuordnungen synchronisiert, weil
   * 'courses' ein virtuelles Feld ist und nicht zur Resource selbst gehört.
   */
  async function handleSubmit() {
    if (props.mode === "create" && selectedTab.value === Tab.COURSE) {
      const existing = courseStore.findCoursesByNumber((formData.value as Course).number ?? "");
      if (existing.length > 0) {
        duplicateCourses.value = existing;
        showDuplicateDialog.value = true;
        return;
      }
    }

    const isStudyGroup = selectedTab.value === Tab.STUDYGROUP;
    const selectedCourses = isStudyGroup
      ? ((formData.value as { courses?: Course[] }).courses ?? [])
      : [];

    switch (props.mode) {
      case "create": {
        if (isStudyGroup) {
          const apiGroup = await studyGroupStore.createStudyGroup(
            formData.value as Omit<StudyGroup, "id">
          );
          if (apiGroup) {
            await syncCoursesForGroup(apiGroup.id, selectedCourses, []);
          }
          formData.value = {};
        } else if (selectedTab.value === Tab.LECTURER) {
          // Zeiten brauchen die ID der neuen Lehrperson
          const lecturer = await lecturerStore.createLecturer(
            formData.value as Omit<Lecturer, "id">
          );
          if (lecturer) {
            await timeConstraints.value?.[0]?.save(lecturer.id);
          }
          formData.value = {};
        } else {
          create();
        }
        break;
      }
      case "edit": {
        update();
        if (selectedTab.value === Tab.LECTURER && lecturerStore.selectedLecturer) {
          await timeConstraints.value?.[0]?.save(lecturerStore.selectedLecturer.id);
        }
        if (isStudyGroup && studyGroupStore.selectedStudyGroup) {
          const group = studyGroupStore.selectedStudyGroup;
          const previous = courseStore.coursesByStudyGroup(group.id);
          await syncCoursesForGroup(group.id, selectedCourses, previous);
        }
        break;
      }
    }

    modal.value?.hide();
  }

  /**
   * Erstellt den Kurs trotz bereits existierender Kursnummer und schließt den Dialog.
   */
  function confirmCreateAnyway() {
    create();
    showDuplicateDialog.value = false;
    modal.value?.hide();
  }

  /**
   * Trägt eine Studiengruppe in die studyGroups-Arrays der gewählten Kurse ein bzw. entfernt
   * sie aus den nicht mehr gewählten. Im Create-Modus ist 'previous' eine leere Liste,
   * sodass nur Zuweisungen hinzugefügt werden.
   *
   * @param groupId - ID der Studiengruppe, deren Kurszuordnungen synchronisiert werden
   * @param current - Aktuell im Formular ausgewählte Kurse
   * @param previous - Vor dem Speichern zugeordnete Kurse
   */
  async function syncCoursesForGroup(groupId: number, current: Course[], previous: Course[]) {
    const previousIds = new Set(previous.map(c => c.id));
    const currentIds = new Set(current.map(c => c.id));

    for (const c of current) {
      if (!previousIds.has(c.id)) {
        await courseStore.updateCourse(c.id, {
          studyGroups: [...c.studyGroups, { id: groupId } as StudyGroup],
        });
      }
    }
    for (const c of previous) {
      if (!currentIds.has(c.id)) {
        await courseStore.updateCourse(c.id, {
          studyGroups: c.studyGroups.filter(sg => sg.id !== groupId),
        });
      }
    }
  }

  /**
   * Ändert den Titel des Modals.
   */
  function createTitle() {
    const resource = t(activeConfig.value.titleKey);
    if (props.mode === "create") {
      return t("resourceDialog.createTitle", { resource });
    }
    return t("resourceDialog.editTitle", { resource });
  }

  /**
   * Initialisiert das virtuelle 'courses'-Feld im StudyGroup-Tab. Im Create-Modus startet die
   * Kursliste leer.
   */
  function onShown() {
    if (selectedTab.value === Tab.STUDYGROUP) {
      const group = props.mode === "create" ? undefined : studyGroupStore.selectedStudyGroup;
      (formData.value as { courses?: Course[] }).courses = group
        ? courseStore.coursesByStudyGroup(group.id)
        : [];
    }
  }
</script>

<style scoped>
  .selector-panel > * {
    align-items: center;
    border-radius: 10px;
    display: flex;
    height: 34px;
    justify-content: center;
    padding: 0;
    transition: all 0.2s ease;
    width: 34px;
  }

  .selector-panel :deep(.icon-button) {
    border-radius: 10px;
  }

  .selector-panel > *:hover {
    background-color: var(--hover-color);
    cursor: pointer;
  }

  .selector-panel .selected {
    background-color: var(--seleted-item-color);
    box-shadow: 0 2px 10px var(--seleted-item-color);
    transform: scale(1.2);
  }

  .duplicate-item {
    overflow-wrap: anywhere;
  }
</style>
