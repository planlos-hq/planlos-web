import { defineStore } from "pinia";
import { ref } from "vue";
import type { PlannerSettings } from "@/models/PlannerSettings";
import { useQueryParameters } from "@/composables/useQueryParameters";
import { Tab } from "@/enums/enums";
import type { ResourceType } from "@/models/ResourceConflict";
import { useStudyGroupStore } from "./studyGroupStore";
import { useLecturerStore } from "./lecturerStore";
import { useCourseStore } from "./courseStore";
import { useDegreeProgramStore } from "./degreeProgramStore";
import { useRoomStore } from "./roomStore";

/**
 * Pinia Store für die Verwaltung der Ansichtseinstellungen
 */
export const useSettingsStore = defineStore("settings", () => {
  const plannerSettings = ref<PlannerSettings>({
    hiddenWeekdays: [],
    studyGroups: new Set([]),
    showBreaks: true,
    tab: Tab.COURSE,
    selectedId: null,
    temp: false,
  });

  const queryParams = useQueryParameters();
  const studyGroupStore = useStudyGroupStore();
  const lecturerStore = useLecturerStore();
  const courseStore = useCourseStore();
  const degreeProgramStore = useDegreeProgramStore();
  const roomStore = useRoomStore();

  /**
   * Die Funktion initialisiert zu Beginn die Plannersettings. Handelt es sich um eine temporäre
   * Stundenplanungsansicht, was durch den Queryparameter `temp` signalisiert wird, werden die in den
   * Queryparametern gespeicherten Einstellungen genutzt. Andernfalls, werden die Einstellugen aus
   * dem LocalStorage genutzt.
   */
  function initializeSettings() {
    removeOldDataFromLocalStorageState();
    const querySettings = queryParams.getQueryParameters();

    if (querySettings.temp) {
      plannerSettings.value = querySettings;
      return;
    }

    const localSettings = loadSettingsFromLocalStorage();
    plannerSettings.value = localSettings;
    updateQueryParameters(localSettings);
  }

  /**
   * Überschreibt die aktuellen Queryparameter
   *
   * @param settings - PlannerSettings Objekt mit neuen Einstellungen
   */
  function updateQueryParameters(settings: PlannerSettings) {
    queryParams.setQueryParameters(settings);
  }

  /**
   * @returns die Stundenplaneransichtseinstellungen gespeichert im LocalStorage
   */
  function loadSettingsFromLocalStorage() {
    const settings: PlannerSettings = {
      hiddenWeekdays: JSON.parse(localStorage.getItem("hiddenWeekdays") ?? "[]"),
      studyGroups: new Set(JSON.parse(localStorage.getItem("selectedStudyGroups") ?? "[]")),
      showBreaks: JSON.parse(localStorage.getItem("showBreaks") ?? "true"),
      tab: JSON.parse(localStorage.getItem("tab") ?? `"${Tab.COURSE}"`),
      selectedId: JSON.parse(localStorage.getItem("selectedId") ?? "null"),
      temp: false,
    };
    return settings;
  }

  /**
   * Diese Funktion entfernt veraltete Studiengruppen und RessourcenIds aus dem Localstorage.
   */
  function removeOldDataFromLocalStorageState() {
    const settings: PlannerSettings = loadSettingsFromLocalStorage();

    // entferne die IDs der Semestergruppen, die nicht mehr existieren, aus dem Localstorage
    settings.studyGroups = new Set(rectifyStudyGroups([...settings.studyGroups]));

    // entferne ungültige selectedID aus dem Localstorage
    if (!isSelectedIdValid(settings.tab, settings.selectedId)) settings.selectedId = null;

    if (!plannerSettings.value.temp) plannerSettings.value = settings;
    setLocalStorage(settings);
  }

  /**
   * Diese Funktion entfernt veraltete Studiengruppen und RessourcenIds aus den Queryparametern.
   */
  function removeOldDataFromQueryParameters() {
    const settings: PlannerSettings = queryParams.getQueryParameters();

    settings.studyGroups = new Set(rectifyStudyGroups([...settings.studyGroups]));

    if (!isSelectedIdValid(settings.tab, settings.selectedId)) settings.selectedId = null;

    if (plannerSettings.value.temp) plannerSettings.value = settings;
    queryParams.setQueryParameters(settings);
  }

  /**
   * Funktion, die Studiengruppen aus einer Liste entfernt, welche nicht im StudyGroupStore existieren.
   *
   * @param studyGroupIds - Liste von StudyGroupIDs
   * @returns - Liste aller noch gültigen IDs
   */
  function rectifyStudyGroups(studyGroupIds: number[]): number[] {
    return studyGroupIds.filter(s => studyGroupStore.studyGroupMap.get(s) !== undefined);
  }

  /**
   *
   * @param tab - betroffener Ressourcentab
   * @param id - ausgewählte Ressource
   * @returns - ob die selectedId zu einer existierenden Ressource gibt
   */
  function isSelectedIdValid(tab: Tab, id: number | null): boolean {
    if (id === null) return false;
    if (id === null) return true;

    switch (tab) {
      case Tab.LECTURER:
        return lecturerStore.lecturerMap.get(id) !== undefined;
      case Tab.STUDYGROUP:
        return studyGroupStore.studyGroupMap.get(id) !== undefined;
      case Tab.DEGREEPROGRAM:
        return degreeProgramStore.degreeProgramMap.get(id) !== undefined;
      case Tab.ROOM:
        return roomStore.roomMap.get(id) !== undefined;
      case Tab.COURSE:
        return courseStore.courseMap.get(id) !== undefined;
      default:
        return false;
    }
  }

  /**
   * Funktion zur Speicherung der aktuellen Einstellungen im LocalStorage.
   *
   * @param settings - aktuelle Stundenplaneransichtseinstellungen
   */
  function setLocalStorage(settings: PlannerSettings) {
    localStorage.setItem("hiddenWeekdays", JSON.stringify(settings.hiddenWeekdays));
    localStorage.setItem("selectedStudyGroups", JSON.stringify([...settings.studyGroups]));
    localStorage.setItem("showBreaks", JSON.stringify(settings.showBreaks));
    localStorage.setItem("tab", JSON.stringify(settings.tab));
    localStorage.setItem("selectedId", JSON.stringify(settings.selectedId));
  }

  function resourceTypeToTab(type: ResourceType): Tab {
    switch (type) {
      case "lecturer":
        return Tab.LECTURER;
      case "room":
        return Tab.ROOM;
      case "study_group":
        return Tab.STUDYGROUP;
    }
  }

  return {
    plannerSettings,
    initializeSettings,
    setLocalStorage,
    loadSettingsFromLocalStorage,
    resourceTypeToTab,
    removeOldDataFromLocalStorageState,
    removeOldDataFromQueryParameters,
  };
});
