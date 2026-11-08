<template>
  <div class="view-panel">
    <section data-setting="weekdays">
      <div class="section-head">
        <span>Wochentage</span>
        <reset-button
          :size="24"
          class="p-1"
          role="button"
          tabindex="0"
          title="Alle Wochentage anzeigen"
          aria-label="Alle Wochentage anzeigen"
          @click="resetWeekdays"
          @keydown.enter.space.prevent="resetWeekdays"
        />
      </div>
      <div class="chips" role="group" aria-label="Sichtbare Wochentage">
        <button
          v-for="day in weekdays"
          :key="day.value"
          type="button"
          class="chip"
          :class="{ active: selectedWeekdays.includes(day.value) }"
          :aria-pressed="selectedWeekdays.includes(day.value)"
          :title="day.text"
          @click="toggleWeekday(day.value)"
        >
          {{ day.short }}
        </button>
      </div>
    </section>

    <section data-setting="breaks">
      <b-form-checkbox v-model="showBreaks" switch>Pausenzeiten anzeigen</b-form-checkbox>
    </section>

    <section class="groups" data-setting="groups">
      <div class="section-head">
        <span>
          Semestergruppen
          <span class="count">{{ selectedStudyGroupCount }} von {{ studyGroupList.length }}</span>
        </span>
        <reset-button
          :size="24"
          class="p-1"
          role="button"
          tabindex="0"
          title="Auswahl zurücksetzen"
          aria-label="Auswahl zurücksetzen"
          @click="resetSelectedStudyGroup"
          @keydown.enter.space.prevent="resetSelectedStudyGroup"
        />
      </div>
      <div class="chips mb-2" role="group" aria-label="Nach Kohorte filtern">
        <button
          v-for="s in semesters"
          :key="s.key"
          type="button"
          class="chip"
          :class="{ active: activeSemesterKeys.has(s.key) }"
          :aria-pressed="activeSemesterKeys.has(s.key)"
          @click="toggleSemester(s.key)"
        >
          {{ s.label }}
        </button>
        <button
          type="button"
          class="chip"
          :class="{ active: onlySelected }"
          :aria-pressed="onlySelected"
          @click="onlySelected = !onlySelected"
        >
          Nur ausgewählte
        </button>
      </div>
      <!-- Search understands e.g. "inf 24", "informatik", "w25", "winter 2024" -->
      <list-with-search
        :items="listItems"
        :searchable-text="item => getDisplayName(item)"
        :matches="matchesStudyGroup"
        :draggable="false"
        :is-item-selected="isStudyGroupSelected"
        :max-height="320"
        :sort-options="sortOptions"
        show-sort-toolbar
        @toggle="id => toggleStudyGroup(id)"
      >
        <template #listElement="{ item }">
          {{ getDisplayName(item) }}
        </template>
      </list-with-search>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from "vue";
  import { BFormCheckbox } from "bootstrap-vue-next";
  import type { StudyGroup } from "@/models/StudyGroup";
  import type { SortOption } from "@/models/SortOptions";
  import ListWithSearch from "./ListWithSearch.vue";
  import ResetButton from "./IconButtons/ResetButton.vue";
  import { matchesStudyGroup, useViewFilters, weekdays } from "@/composables/useViewFilters";

  /** Anzeige-Filter in Einstellungen → Ansicht: Wochentage, Pausen und Semestergruppen */
  const {
    selectedWeekdays,
    toggleWeekday,
    resetWeekdays,
    showBreaks,
    semesters,
    activeSemesterKeys,
    toggleSemester,
    filteredStudyGroupList,
    studyGroupList,
    isStudyGroupSelected,
    toggleStudyGroup,
    resetSelectedStudyGroup,
    selectedStudyGroupCount,
    getDisplayName,
  } = useViewFilters();

  const onlySelected = ref(false);

  const listItems = computed(() =>
    onlySelected.value
      ? filteredStudyGroupList.value.filter(isStudyGroupSelected)
      : filteredStudyGroupList.value
  );

  const byName = (a: StudyGroup, b: StudyGroup) =>
    getDisplayName(a).localeCompare(getDisplayName(b));
  /** Newest cohort first, winter before summer of the same year */
  const byCohort = (a: StudyGroup, b: StudyGroup) =>
    b.semesterYear - a.semesterYear || b.semesterSeason.localeCompare(a.semesterSeason);

  const sortOptions: SortOption<StudyGroup>[] = [
    { label: "Name", comparator: byName },
    { label: "Jahrgang", comparator: (a, b) => byCohort(a, b) || byName(a, b) },
    {
      label: "Studiengang",
      comparator: (a, b) =>
        a.degreeProgram.name.localeCompare(b.degreeProgram.name) || byCohort(a, b),
    },
    {
      label: "Ausgewählte zuerst",
      comparator: (a, b) =>
        Number(isStudyGroupSelected(b)) - Number(isStudyGroupSelected(a)) || byName(a, b),
    },
  ];
</script>

<style scoped>
  .view-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-head {
    align-items: center;
    display: flex;
    font-weight: 600;
    justify-content: space-between;
    margin-bottom: 0.4rem;
  }

  .count {
    color: var(--bs-secondary-color);
    font-size: 0.85rem;
    font-weight: 400;
    margin-left: 0.35rem;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .chip {
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    color: var(--bs-secondary-color);
    font-size: 0.85rem;
    min-width: 2.5rem;
    padding: 0.15rem 0.6rem;
  }

  .chip.active {
    background: var(--seleted-item-color);
    border-color: var(--button-color);
    color: var(--button-color);
    font-weight: 600;
  }

  /* The list caps its own width for the sidebar; here it should fill the space
     and line up with the headings (no extra side padding) */
  .groups :deep(.component-container) {
    max-width: none;
  }

  .groups :deep(.search-bar) {
    padding: 0 0 0.25rem;
  }

  .groups :deep(.sort-toolbar) {
    margin-left: 0 !important;
    padding-inline: 0 !important;
  }

  .groups :deep(.list-box) {
    margin-inline: 0;
    padding-inline: 0;
  }

  .chip:focus-visible,
  .section-head :deep(.icon-button:focus-visible) {
    outline: 2px solid var(--button-color);
    outline-offset: 1px;
  }
</style>
