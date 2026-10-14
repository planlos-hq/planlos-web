<template>
  <b-modal title="Einstellungen" size="xl" no-animation no-footer>
    <import-export-dialog v-if="showImportExportDialog" v-model="showImportExportDialog" />

    <div class="settings-grid">
      <div class="settings-col">
        <div class="reset">
          <p class="heading">Welche Wochentage sollen angezeigt werden?</p>
          <reset-button @click="resetWeekdays" :size="30"></reset-button>
        </div>

        <b-form-group class="d-flex flex-column align-items-center mt-3">
          <b-form-checkbox-group v-model="selected" :options="weekdays" stacked />
        </b-form-group>

        <p class="heading">Pausenzeiten anzeigen?</p>
        <b-form-checkbox v-model="plannerSettings.showBreaks" />

        <div class="csv-section">
          <p class="heading">Import / Export</p>
          <b-button variant="outline-primary" size="sm" @click="showImportExportDialog = true">
            <upload :size="14" class="me-1" />
            CSV / Excel Import / Export
          </b-button>
        </div>

        <b-button variant="primary" class="mt-auto" @click="close">Schließen</b-button>
      </div>

      <div class="settings-col">
        <div class="reset">
          <p class="heading">Semestergruppen auswählen</p>
          <reset-button @click="resetSelectedStudyGroup" :size="30" />
        </div>

        <div class="semester-layout">
          <div class="semester-filter">
            <button
              v-for="s in semesters"
              :key="s.key"
              type="button"
              class="semester-chip"
              :class="{ active: activeSemesterKeys.has(s.key) }"
              @click="toggleSemester(s.key)"
            >
              {{ s.label }}
            </button>
          </div>

          <div class="semester-list">
            <list-with-search
              :items="filteredStudyGroupList"
              :searchable-text="item => getDisplayName(item)"
              :draggable="false"
              :is-item-selected="isStudyGroupSelected"
              @toggle="id => toggleStudyGroup(id)"
            >
              <template #listElement="{ item }">
                {{ getDisplayName(item) }}
              </template>
            </list-with-search>
          </div>
        </div>
      </div>
    </div>
  </b-modal>
</template>

<script setup lang="ts">
  import { ref, computed } from "vue";
  import { useStudyGroupStore } from "@/stores/studyGroupStore";
  import {
    BModal,
    BFormCheckboxGroup,
    BFormGroup,
    BButton,
    BFormCheckbox,
  } from "bootstrap-vue-next";
  import ListWithSearch from "./ListWithSearch.vue";
  import { WeekDays, SemesterSeason } from "@/enums/enums";
  import type { StudyGroup } from "@/models/StudyGroup";
  import ResetButton from "./IconButtons/ResetButton.vue";
  import { storeToRefs } from "pinia";
  import { useSettingsStore } from "@/stores/settingsStore";
  import { Upload } from "lucide-vue-next";
  import ImportExportDialog from "./ImportExportDialog.vue";

  const store = useSettingsStore();
  const { plannerSettings } = storeToRefs(store);

  const showImportExportDialog = ref(false);

  const weekdays = [
    { text: "Montag", value: WeekDays.MONTAG },
    { text: "Dienstag", value: WeekDays.DIENSTAG },
    { text: "Mittwoch", value: WeekDays.MITTWOCH },
    { text: "Donnerstag", value: WeekDays.DONNERSTAG },
    { text: "Freitag", value: WeekDays.FREITAG },
    { text: "Samstag", value: WeekDays.SAMSTAG },
    { text: "Sonntag", value: WeekDays.SONNTAG },
  ];

  const studyGroupStore = useStudyGroupStore();
  const { studyGroupList } = storeToRefs(studyGroupStore);

  const activeSemesterKeys = ref(new Set<string>());

  const semesters = computed(() => {
    const map = new Map<
      string,
      { key: string; label: string; year: number; season: SemesterSeason }
    >();
    for (const studyGroup of studyGroupList.value) {
      const key = `${studyGroup.semesterSeason}-${studyGroup.semesterYear}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: `${studyGroup.semesterSeason.charAt(0).toUpperCase()}${studyGroup.semesterYear % 100}`,
          year: studyGroup.semesterYear,
          season: studyGroup.semesterSeason,
        });
      }
    }
    return [...map.values()].sort(
      (a, b) => b.year - a.year || (a.season === SemesterSeason.WINTER ? -1 : 1)
    );
  });

  function toggleSemester(key: string) {
    if (activeSemesterKeys.value.has(key)) {
      activeSemesterKeys.value.delete(key);
    } else {
      activeSemesterKeys.value.add(key);
    }
  }

  const filteredStudyGroupList = computed(() => {
    if (activeSemesterKeys.value.size === 0) {
      return studyGroupList.value;
    }
    return studyGroupList.value.filter(studyGroup =>
      activeSemesterKeys.value.has(`${studyGroup.semesterSeason}-${studyGroup.semesterYear}`)
    );
  });

  const selected = computed({
    get: () =>
      weekdays.map(w => w.value).filter(day => !plannerSettings.value.hiddenWeekdays.includes(day)),
    set: (value: WeekDays[]) => {
      plannerSettings.value.hiddenWeekdays = weekdays
        .map(w => w.value)
        .filter(day => !value.includes(day));
    },
  });

  const emit = defineEmits<{
    close: [void];
  }>();

  function close() {
    emit("close");
  }

  function isStudyGroupSelected(item: StudyGroup) {
    const studyGroup = studyGroupStore.readStudyGroup(item.id);
    if (!studyGroup) return false;
    return plannerSettings.value.studyGroups.has(studyGroup.id);
  }

  function toggleStudyGroup(id: number) {
    const studyGroup = studyGroupStore.readStudyGroup(id);
    if (!studyGroup) return;

    if (plannerSettings.value.studyGroups.has(studyGroup.id)) {
      plannerSettings.value.studyGroups.delete(studyGroup.id);
    } else {
      plannerSettings.value.studyGroups.add(studyGroup.id);
    }
  }

  function resetSelectedStudyGroup() {
    plannerSettings.value.studyGroups.clear();
  }

  function resetWeekdays() {
    selected.value = weekdays.map(w => w.value);
  }

  function getDisplayName(studyGroup: StudyGroup) {
    return `${studyGroup.degreeProgram.abbreviation}${studyGroup.semesterYear % 100}_${studyGroup.semesterSeason.charAt(0).toUpperCase()}`;
  }
</script>

<style scoped lang="css">
  .heading {
    font-weight: bold;
  }

  .reset {
    align-items: center;
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .reset p {
    margin: 0;
  }

  .csv-section {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .settings-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .settings-col {
    align-items: center;
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 16rem;
    text-align: center;
  }

  .semester-layout {
    align-items: flex-start;
    display: flex;
    gap: 0.75rem;
    width: 100%;
  }

  .semester-filter {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 0.4rem;
    max-height: 65vh;
    overflow-y: auto;
    padding-top: 2.8%;
  }

  .semester-list {
    flex: 1 1 0;
    min-width: 0;
  }

  .semester-list :deep(.list-wrapper) {
    max-height: 55vh;
  }

  .semester-chip {
    background: none;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.8rem;
    line-height: 1;
    padding: 0.25rem 0.6rem;
    transition: background-color 0.15s ease;
  }

  .semester-chip:hover {
    background-color: var(--hover-color);
  }

  .semester-chip.active {
    background-color: var(--button-color);
    border-color: var(--button-color);
    color: white;
  }
</style>
