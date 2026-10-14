<template>
  <b-modal
    :title="title"
    size="md"
    ref="modal"
    scrollable
    @cancel="cancel"
    @show="onShown"
    lazy
    unmount-lazy
    no-animation
  >
    <div
      class="d-flex flex-row justify-content-center justify-content-evenly mb-4 selector-panel"
      v-if="mode === 'create'"
    >
      <planning-button
        @click="selectResource(Tab.COURSE)"
        :size="20"
        :class="{ selected: selectedTab === Tab.COURSE }"
        title="Veranstaltungen"
      />
      <lecturer-button
        @click="selectResource(Tab.LECTURER)"
        :size="20"
        :class="{ selected: selectedTab === Tab.LECTURER }"
        title="Lehrpersonen"
      />
      <study-group-button
        @click="selectResource(Tab.STUDYGROUP)"
        :size="20"
        :class="{ selected: selectedTab === Tab.STUDYGROUP }"
        title="Semestergruppen"
      />
      <degree-programm-button
        @click="selectResource(Tab.DEGREEPROGRAM)"
        :size="20"
        :class="{ selected: selectedTab === Tab.DEGREEPROGRAM }"
        title="Studiengänge"
      />
      <room-button
        @click="selectResource(Tab.ROOM)"
        :size="20"
        :class="{ selected: selectedTab === Tab.ROOM }"
        title="Räume"
      />
    </div>

    <b-form @submit.prevent="handleSubmit">
      <b-form-group class="d-flex flex-column gap-2">
        <form-input
          v-for="object in activeConfig.attributes"
          :key="object.key"
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
        <div>
          <extra-resource-data v-model="(formData as BaseResource).extraData" />
        </div>
      </b-form-group>
      <button type="submit" ref="submitButton" style="display: none"></button>
    </b-form>

    <b-modal
      v-model="showDuplicateDialog"
      title="Kursnummer bereits vergeben"
      centered
      ok-title="Trotzdem erstellen"
      ok-variant="primary"
      cancel-title="Abbrechen"
      cancel-variant="danger"
      @ok="confirmCreateAnyway"
      no-animation
    >
      <p>
        Es {{ duplicateCourses.length === 1 ? "existiert bereits" : "existieren bereits" }}
        {{ duplicateCourses.length }}
        {{ duplicateCourses.length === 1 ? "Kurs" : "Kurse" }} mit der Nummer
        <strong>{{ duplicateCourses[0]?.number }}</strong
        >:
      </p>
      <b-list-group class="mb-3">
        <b-list-group-item
          v-for="course in duplicateCourses"
          :key="course.id"
          class="duplicate-item"
        >
          {{ course.abbreviation }} – {{ course.name }}
        </b-list-group-item>
      </b-list-group>
      <p class="mb-0">Möchten Sie den Kurs trotzdem erstellen?</p>
    </b-modal>

    <template #footer="{ cancel }">
      <b-button @click="cancel()" variant="danger">Abbrechen</b-button>
      <b-button @click="triggerSubmit" variant="primary" v-if="selectedTab">
        {{ mode === "create" ? "Speichern" : "Änderungen übernehmen" }}
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
  import FormInput, { type FormInputType, type SelectOption } from "./FormInput.vue";
  import type { Lecturer } from "@/models/Lecturer";
  import { useRoomStore } from "@/stores/roomStore";
  import type { Room } from "@/models/Room";
  import type { StudyGroup } from "@/models/StudyGroup";
  import { useStudyGroupStore } from "@/stores/studyGroupStore";
  import { useDegreeProgramStore } from "@/stores/degreeProgramStore";
  import { LecturerKind, mapLecturerKindToString, SemesterSeason } from "@/enums/enums";
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
  import type { StudyGroupTemplate } from "@/models/StudyGroupTemplate.ts";
  import TemplatePopUp from "./TemplatePopUp.vue";

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
    title: string;
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

  const selectedTab = ref<Tab>(props.selectedTab);
  const title = computed(() => createTitle());
  const submitButton = useTemplateRef("submitButton");
  const modal = useTemplateRef("modal");
  const showDuplicateDialog = ref(false);
  const duplicateCourses = ref<Course[]>([]);
  const showTemplatePopUp = ref<boolean>(false);

  const lecturerStore = useLecturerStore();
  const roomStore = useRoomStore();
  const studyGroupStore = useStudyGroupStore();
  const degreeProgramStore = useDegreeProgramStore();
  const courseStore = useCourseStore();
  const templateStore = useTemplateStore();

  watch(
    () => props.selectedTab,
    newValue => {
      selectedTab.value = newValue;
    }
  );

  const resourceConfigs: ResourceConfigs = {
    lecturer: {
      title: "Lehrperson",
      selectedResource: () => lecturerStore.selectedLecturer,
      create: item => lecturerStore.createLecturer(item),
      update: (id, updates) => lecturerStore.updateLecturer(id, updates),
      select: id => lecturerStore.selectLecturer(id),
      delete: id => lecturerStore.deleteLecturer(id),
      fields: ["firstName", "lastName", "abbreviation", "notes", "kind", "isRelevant", "extraData"],
      attributes: [
        { key: "firstName", placeholder: "Vorname", type: "text", required: true },
        { key: "lastName", placeholder: "Nachname", type: "text", required: true },
        { key: "abbreviation", placeholder: "Abkürzung", type: "text", required: true },
        { key: "notes", placeholder: "Notizen", type: "text-area", required: false },
        {
          key: "kind",
          placeholder: "Typ",
          type: "select",
          required: false,
          options: computed(() =>
            Object.values(LecturerKind).map(value => ({
              value: value,
              text: mapLecturerKindToString(value),
            }))
          ),
        },
        { key: "isRelevant", placeholder: "zur Planung aktiv", type: "checkbox", required: false },
      ],
    },
    room: {
      title: "Raum",
      selectedResource: () => roomStore.selectedRoom,
      create: item => roomStore.createRoom(item),
      update: (id, updates) => roomStore.updateRoom(id, updates),
      select: id => roomStore.selectRoom(id),
      delete: id => roomStore.deleteRoom(id),
      fields: ["number", "name", "seats", "extraData"],
      attributes: [
        { key: "number", placeholder: "Raumnummer", type: "text", required: true },
        { key: "name", placeholder: "Raumbezeichnung", type: "text", required: false },
        { key: "seats", placeholder: "Anzahl an Plätzen", type: "number", required: false },
      ],
    },
    studyGroup: {
      title: "Semestergruppe",
      selectedResource: () => studyGroupStore.selectedStudyGroup,
      create: item => studyGroupStore.createStudyGroup(item),
      update: (id, updates) => studyGroupStore.updateStudyGroup(id, updates),
      select: id => studyGroupStore.selectStudyGroup(id),
      delete: id => studyGroupStore.deleteStudyGroup(id),
      fields: ["degreeProgram", "semesterSeason", "semesterYear", "studentCount", "extraData"],
      attributes: [
        {
          key: "degreeProgram",
          placeholder: "Studiengang",
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
          placeholder: "Jahr",
          type: "number",
          required: true,
        },
        {
          key: "semesterSeason",
          placeholder: "Semester",
          type: "select",
          required: true,
          options: computed(() =>
            Object.values(SemesterSeason).map(value => ({
              value: value,
              text: value === SemesterSeason.SUMMER ? "Sommer" : "Winter",
            }))
          ),
        },
        {
          key: "studentCount",
          placeholder: "Anzahl an Studierenden",
          type: "number",
          required: false,
        },
        {
          key: "headings",
          placeholder: "Veranstaltungen zur Semestergruppe zuweisen",
          type: "heading",
          required: false,
        },
        {
          key: "templates",
          placeholder: "Vorlagen für Veranstaltungen",
          type: "select-with-edit",
          required: false,
          options: computed(() =>
            templateStore.templateList.map(t => ({
              value: t,
              text: t.name,
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
          placeholder: "Veranstaltungen zuweisen",
          type: "search-select",
          required: false,
          options: computed(() => courseStore.courseList),
          storeRead: courseStore.readCourse,
          format: (c: Course) => `${c.abbreviation} - ${c.name}`,
        },
      ],
    },
    degreeProgram: {
      title: "Studiengang",
      selectedResource: () => degreeProgramStore.selectedDegreeProgram,
      create: item => degreeProgramStore.createDegreeProgram(item),
      update: (id, updates) => degreeProgramStore.updateDegreeProgram(id, updates),
      select: id => degreeProgramStore.selectDegreeProgram(id),
      delete: id => degreeProgramStore.deleteDegreeProgram(id),
      fields: ["name", "abbreviation", "extraData"],
      attributes: [
        { key: "name", placeholder: "Studiengangsname", type: "text", required: true },
        { key: "abbreviation", placeholder: "Studiengangsabkürzung", type: "text", required: true },
      ],
    },
    course: {
      title: "Kurs",
      selectedResource: () => courseStore.selectedCourse,
      create: item => courseStore.createCourse(item),
      update: (id, updates) => courseStore.updateCourse(id, updates),
      select: id => courseStore.selectCourse(id),
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
          placeholder: "Nummer",
          type: "text",
          required: true,
        },
        {
          key: "name",
          placeholder: "Name",
          type: "text",
          required: true,
        },
        {
          key: "abbreviation",
          placeholder: "Abkürzung",
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
          placeholder: "Lehrpersonen zuweisen",
          type: "search-select",
          required: false,
          options: computed(() => lecturerStore.relevantLecturers),
          storeRead: lecturerStore.readLecturer,
          format: (l: Lecturer) => `${l.firstName} ${l.lastName}`,
        },
        {
          key: "studyGroups",
          placeholder: "Semestergruppen zuweisen",
          type: "search-select",
          required: false,
          options: computed(() => studyGroupStore.studyGroupList),
          storeRead: studyGroupStore.readStudyGroup,
          format: (s: StudyGroup) =>
            `${s.degreeProgram.abbreviation}${s.semesterYear % 100}_${s.semesterSeason.charAt(0).toUpperCase()}`,
        },
      ],
    },
  };
  const activeConfig = computed(() => {
    return resourceConfigs[selectedTab.value as keyof typeof resourceConfigs];
  });

  const { formData, update, create, cancel, isItemSelected, toggleItem } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useResourceForm<any>(
      () => activeConfig.value.selectedResource(),
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
        } else {
          create();
        }
        break;
      }
      case "edit": {
        update();
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
    switch (props.mode) {
      case "create":
        return activeConfig.value.title + " erstellen";
      case "edit":
        return activeConfig.value.title + " anpassen";
    }
  }

  /**
   * Leert die Auswahlfelder zum Erstellen von Resourcen und initialisiert das virtuelle
   * 'courses'-Feld im StudyGroup-Tab. Die Resets müssen zuerst laufen, damit im Create-Modus
   * die Kursliste anschließend mit einer leeren Liste startet.
   */
  function onShown() {
    if (props.mode === "create") {
      lecturerStore.selectLecturer(null);
      studyGroupStore.selectStudyGroup(null);
      degreeProgramStore.selectDegreeProgram(null);
      roomStore.selectRoom(null);
      courseStore.selectCourse(null);
    }

    if (selectedTab.value === Tab.STUDYGROUP) {
      const group = studyGroupStore.selectedStudyGroup;
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

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
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
    word-break: break-word;
  }
</style>
