<template>
  <b-form class="template-form" @submit.prevent="emit('save')">
    <h4 class="form-title">
      {{ mode === "create" ? "Neue Vorlage erstellen" : "Vorlage bearbeiten" }}
    </h4>

    <b-form-floating-label label="Name" label-for="template-name">
      <b-form-input
        id="template-name"
        ref="nameInput"
        placeholder="Name"
        required
        autocomplete="off"
        :model-value="name"
        :disabled="isSaving"
        @update:model-value="handleNameInput"
      />
    </b-form-floating-label>

    <div class="picker">
      <div class="picker-column">
        <list-with-search
          :items="courseStore.courseList"
          :matches="matchesSearch"
          :is-item-selected="isCourseSelected"
          :draggable="false"
          :max-height="260"
          :sort-options="sortOptions"
          show-sort-toolbar
          @toggle="toggleCourse"
        >
          <template #listElement="{ item }">
            <span :title="courseLabel(item)">{{ courseLabel(item) }}</span>
          </template>
        </list-with-search>
      </div>

      <div class="picker-column">
        <div class="selected-head">
          <h5 class="selected-title">Ausgewählt ({{ courseIds.length }})</h5>
          <reset-button
            :size="24"
            :class="{ locked: isResetLocked, 'opacity-50': courseIds.length === 0 }"
            role="button"
            :tabindex="isResetLocked ? -1 : 0"
            title="Auswahl zurücksetzen"
            aria-label="Auswahl zurücksetzen"
            :aria-disabled="isResetLocked"
            @click="resetSelection"
            @keydown.enter.prevent="resetSelection"
            @keydown.space.prevent="resetSelection"
          />
        </div>

        <div
          class="selected-list"
          :class="{
            'd-flex align-items-center justify-content-center': selectedCourses.length === 0,
          }"
        >
          <p v-if="selectedCourses.length === 0" class="m-0 text-body-secondary">
            Noch nichts ausgewählt.
          </p>
          <b-list-group v-else class="d-flex flex-column gap-1">
            <b-list-group-item
              v-for="entry in selectedCourses"
              :key="entry.id"
              class="d-flex justify-content-between align-items-center rounded-3"
              :class="{ 'text-danger': entry.isMissing }"
              :title="entry.label"
            >
              <span class="text-truncate">{{ entry.label }}</span>
              <delete-button
                class="p-1"
                :class="{ locked: disabled }"
                :size="24"
                role="button"
                :tabindex="disabled ? -1 : 0"
                :aria-label="`${entry.label} entfernen`"
                :aria-disabled="disabled"
                @click="toggleCourse(entry.id)"
                @keydown.enter.prevent="toggleCourse(entry.id)"
                @keydown.space.prevent="toggleCourse(entry.id)"
              />
            </b-list-group-item>
          </b-list-group>
        </div>
      </div>
    </div>

    <div class="form-footer">
      <p class="hint" aria-live="polite">{{ saveHint }}</p>
      <b-button
        type="submit"
        variant="primary"
        :disabled="!canSave"
        :loading="isSaving"
        loading-text="Wird gespeichert…"
      >
        Speichern
      </b-button>
    </div>
  </b-form>
</template>

<script setup lang="ts">
  import { computed, useTemplateRef } from "vue";
  import {
    BButton,
    BForm,
    BFormFloatingLabel,
    BFormInput,
    BListGroup,
    BListGroupItem,
  } from "bootstrap-vue-next";
  import DeleteButton from "../IconButtons/DeleteButton.vue";
  import ResetButton from "../IconButtons/ResetButton.vue";
  import ListWithSearch from "../ListWithSearch.vue";
  import { useCourseStore } from "@/stores/courseStore";
  import type { Course } from "@/models/Course";
  import type { SortOption } from "@/models/SortOptions";
  import type { TemplateId } from "@/composables/useTemplateOverlay";

  /** Ein Eintrag in der rechten Liste */
  type SelectedCourseEntry = {
    id: TemplateId;
    label: string;
    isMissing: boolean;
  };

  const props = defineProps<{
    /** Erstellen oder Bearbeiten */
    mode: "create" | "edit";
    /** Name im Entwurf */
    name: string;
    /** IDs der ausgewählten Veranstaltungen */
    courseIds: TemplateId[];
    /** true, wenn gespeichert werden darf */
    canSave: boolean;
    /** Warum Speichern gesperrt ist. Leer, wenn es erlaubt ist. */
    saveHint: string;
    /** true, während gespeichert wird */
    isSaving: boolean;
    /** sperrt die Eingaben, solange gespeichert oder gelöscht wird */
    disabled: boolean;
  }>();

  const emit = defineEmits<{
    /** Der Name wurde geändert */
    "update:name": [name: string];
    /** Eine Veranstaltung wurde hinzugefügt oder entfernt */
    "toggle-course": [courseId: TemplateId];
    /** Die Auswahl soll geleert werden */
    "reset-selection": [void];
    /** Es soll gespeichert werden */
    save: [void];
  }>();

  const courseStore = useCourseStore();
  const nameInput = useTemplateRef<{ $el: HTMLElement }>("nameInput");

  /**
   * Anzeigename einer Veranstaltung: Nummer - Name (Kürzel).
   *
   * @param course - die Veranstaltung
   * @returns Anzeigename
   */
  function courseLabel(course: Course): string {
    return `${course.number} - ${course.name} (${course.abbreviation})`;
  }

  /** Sortierung der linken Liste, wie in der Sidebar */
  const sortOptions: SortOption<Course>[] = [
    { label: "Name", comparator: (a, b) => a.name.localeCompare(b.name) },
    { label: "Nummer", comparator: (a, b) => a.number.localeCompare(b.number) },
    { label: "Abkürzung", comparator: (a, b) => a.abbreviation.localeCompare(b.abbreviation) },
  ];

  /**
   * Ausgewählte Veranstaltungen bleiben in der linken Liste, werden dort aber hervorgehoben.
   * Ein Klick darauf wählt sie wieder ab.
   *
   * @param course - die Veranstaltung
   * @returns true, wenn die Veranstaltung ausgewählt ist
   */
  function isCourseSelected(course: Course): boolean {
    return props.courseIds.includes(course.id);
  }

  /**
   * Suche der linken Liste: der Suchtext muss im Anzeigenamen vorkommen.
   *
   * @param course - die Veranstaltung
   * @param query - Suchtext (von der Liste schon klein geschrieben)
   * @returns true, wenn die Veranstaltung passt
   */
  function matchesSearch(course: Course, query: string): boolean {
    return courseLabel(course).toLowerCase().includes(query);
  }

  /** Rechte Liste. Gelöschte Veranstaltungen bleiben sichtbar, damit man sie entfernen kann. */
  const selectedCourses = computed<SelectedCourseEntry[]>(() =>
    props.courseIds.map(id => {
      const course = courseStore.courseMap.get(id);

      return {
        id,
        label:
          course !== undefined
            ? `${course.number} ${course.name}`
            : `Veranstaltung ${id} – nicht mehr vorhanden`,
        isMissing: course === undefined,
      };
    })
  );

  /** Reset ist gesperrt, wenn nichts ausgewählt ist oder gerade gespeichert wird */
  const isResetLocked = computed<boolean>(() => props.disabled || props.courseIds.length === 0);

  /** Icon-Buttons sind <div>s ohne `disabled`, deshalb wird die Sperre hier geprüft */
  function resetSelection(): void {
    if (isResetLocked.value) return;
    emit("reset-selection");
  }

  /**
   * Fügt eine Veranstaltung hinzu (linke Liste) oder entfernt sie (Kreuz am Tag).
   * Die Liste und die Icon-Buttons haben kein `disabled`, deshalb wird die Sperre hier geprüft.
   *
   * @param courseId - ID der Veranstaltung
   */
  function toggleCourse(courseId: TemplateId): void {
    if (props.disabled) return;
    emit("toggle-course", courseId);
  }

  /**
   * Gibt den Namen immer als Text weiter, auch wenn das Feld eine Zahl liefert.
   *
   * @param value - neuer Inhalt des Namensfelds
   */
  function handleNameInput(value: string | number | null): void {
    emit("update:name", value === null ? "" : String(value));
  }

  /**
   * Setzt den Cursor ins Namensfeld.
   */
  function focusName(): void {
    nameInput.value?.$el?.focus();
  }

  defineExpose({ focusName });
</script>

<style scoped lang="css">
  .template-form {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 0;
  }

  .form-title {
    font-size: 1.25rem;
    margin: 0;
    text-align: center;
  }

  .picker {
    display: grid;
    flex: 1;
    gap: 1rem;
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }

  .picker-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
    min-width: 0;
  }

  .selected-list {
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    flex: 1;
    max-height: 160px;
    min-height: 0;
    overflow-y: auto;
    padding: 5px;
  }

  .locked {
    pointer-events: none;
  }

  .selected-head {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .selected-title {
    font-size: 0.95rem;
    margin: 0;
  }

  .form-footer {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .hint {
    color: var(--bs-secondary-color);
    flex: 1 1 180px;
    font-size: 0.85rem;
    margin: 0;
  }

  @media (width >= 768px) {
    .picker {
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    }

    /* Die Liste füllt hier die Spalte, die 260px-Grenze gilt nur auf kleinen Bildschirmen */
    .picker-column :deep(.list-wrapper),
    .selected-list {
      max-height: none;
    }
  }
</style>
