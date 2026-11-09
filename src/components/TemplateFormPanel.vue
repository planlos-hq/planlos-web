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
        <b-form-input
          v-model="courseSearch"
          type="search"
          placeholder="Veranstaltung suchen…"
          aria-label="Veranstaltungen suchen"
          autocomplete="off"
        />

        <div class="picker-box course-list">
          <p v-if="visibleCourses.length === 0" class="my-3 text-center text-body-secondary">
            {{ emptyCourseListText }}
          </p>
          <button
            v-for="course in visibleCourses"
            :key="course.id"
            type="button"
            class="course-row"
            :title="courseLabel(course)"
            :disabled="disabled"
            @click="emit('toggle-course', course.id)"
          >
            <span class="course-label">{{ courseLabel(course) }}</span>
          </button>
        </div>
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

        <div class="picker-box tag-list">
          <p v-if="selectedCourses.length === 0" class="my-3 text-center text-body-secondary">
            Noch nichts ausgewählt.
          </p>
          <span
            v-for="entry in selectedCourses"
            :key="entry.id"
            class="tag"
            :class="{ 'tag-missing': entry.isMissing }"
            :title="entry.label"
          >
            <span class="tag-label">{{ entry.label }}</span>
            <icon-button
              class="tag-remove"
              :class="{ locked: disabled }"
              :size="22"
              role="button"
              :tabindex="disabled ? -1 : 0"
              :aria-label="`${entry.label} entfernen`"
              :aria-disabled="disabled"
              @click="removeCourse(entry.id)"
              @keydown.enter.prevent="removeCourse(entry.id)"
              @keydown.space.prevent="removeCourse(entry.id)"
            >
              <x :size="14" />
            </icon-button>
          </span>
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
  import { computed, ref, useTemplateRef } from "vue";
  import { BButton, BForm, BFormFloatingLabel, BFormInput } from "bootstrap-vue-next";
  import { X } from "lucide-vue-next";
  import IconButton from "@/template/IconButton.vue";
  import ResetButton from "./IconButtons/ResetButton.vue";
  import { useCourseStore } from "@/stores/courseStore";
  import type { Course } from "@/models/Course";
  import type { TemplateId } from "@/composables/useTemplateOverlay";

  /** Ein Tag in der rechten Liste */
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
  const courseSearch = ref<string>("");
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

  /** Linke Liste: alle nicht ausgewählten Veranstaltungen, die zur Suche passen */
  const visibleCourses = computed(() => {
    const needle = courseSearch.value.trim().toLocaleLowerCase("de");
    const selectedIds = new Set(props.courseIds);

    return courseStore.courseList.filter(
      course =>
        !selectedIds.has(course.id) &&
        (needle === "" || courseLabel(course).toLocaleLowerCase("de").includes(needle))
    );
  });

  /** Text, wenn die linke Liste leer ist */
  const emptyCourseListText = computed<string>(() => {
    if (courseSearch.value.trim() !== "") return "Keine Veranstaltung gefunden.";
    if (courseStore.courseList.length === 0) return "Keine Veranstaltungen vorhanden.";
    return "Alle Veranstaltungen sind ausgewählt.";
  });

  /** Rechte Liste. Gelöschte Veranstaltungen bleiben sichtbar, damit man sie entfernen kann. */
  const selectedCourses = computed<SelectedCourseEntry[]>(() =>
    props.courseIds.map(id => {
      const course = courseStore.courseMap.get(id);

      return {
        id,
        label:
          course !== undefined ? courseLabel(course) : `Veranstaltung ${id} – nicht mehr vorhanden`,
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
   * Entfernt eine Veranstaltung über das Kreuz am Tag.
   *
   * @param courseId - ID der Veranstaltung
   */
  function removeCourse(courseId: TemplateId): void {
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

  .picker-box {
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    display: flex;
    flex: 1;
    gap: 0.25rem;
    min-height: 0;
    overflow-y: auto;
  }

  .course-list {
    flex-direction: column;
    max-height: 260px;
    padding: 4px;
  }

  .tag-list {
    align-content: flex-start;
    flex-flow: row wrap;
    max-height: 160px;
    padding: 8px;
  }

  .locked {
    pointer-events: none;
  }

  .course-row {
    align-items: center;
    background-color: transparent;
    border: 0;
    border-radius: 0.25rem;
    color: inherit;
    display: flex;
    padding: 7px 8px;
    text-align: left;
  }

  .course-row:hover {
    background-color: var(--hover-color);
  }

  .course-row:disabled {
    background-color: transparent;
  }

  .course-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  .tag {
    align-items: center;
    background-color: var(--seleted-item-color);
    border-radius: 999px;
    color: var(--button-color);
    display: inline-flex;
    font-size: 0.85rem;
    gap: 2px;
    max-width: 100%;
    padding: 2px 3px 2px 9px;
  }

  .tag-missing {
    background-color: rgb(180 35 24 / 12%);
    color: var(--bs-danger);
  }

  .tag-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tag-remove {
    flex: none;
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

    .course-list,
    .tag-list {
      max-height: none;
    }
  }
</style>
