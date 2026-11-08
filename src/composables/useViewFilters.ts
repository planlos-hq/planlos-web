import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { SemesterSeason, WeekDays } from "@/enums/enums";
import type { StudyGroup } from "@/models/StudyGroup";
import { useStudyGroupStore } from "@/stores/studyGroupStore";
import { useViewStore } from "@/stores/viewStore";

export const weekdays = [
  { text: "Montag", short: "Mo", value: WeekDays.MONTAG },
  { text: "Dienstag", short: "Di", value: WeekDays.DIENSTAG },
  { text: "Mittwoch", short: "Mi", value: WeekDays.MITTWOCH },
  { text: "Donnerstag", short: "Do", value: WeekDays.DONNERSTAG },
  { text: "Freitag", short: "Fr", value: WeekDays.FREITAG },
  { text: "Samstag", short: "Sa", value: WeekDays.SAMSTAG },
  { text: "Sonntag", short: "So", value: WeekDays.SONNTAG },
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .trim();

/**
 * Prüft, ob eine Semestergruppe zur Suche passt. Jedes Wort der Suche muss
 * passen: als Anfang von Kürzel, Name (z. B. INF24_W), Jahr (24, 2024) oder
 * Semester (winter, ws, w24); ab 4 Zeichen auch irgendwo im Studiengang.
 * Beispiele: "inf 24", "inf24", "informatik", "w24", "winter 2024", "tech".
 *
 * @param studyGroup - Semestergruppe
 * @param query - Suchtext
 * @returns true, wenn alle Wörter passen (leere Suche passt immer)
 */
export function matchesStudyGroup(studyGroup: StudyGroup, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const abbr = normalize(studyGroup.degreeProgram.abbreviation);
  const name = normalize(studyGroup.degreeProgram.name);
  const year = String(studyGroup.semesterYear);
  const short = year.slice(-2);
  const winter = studyGroup.semesterSeason === SemesterSeason.WINTER;
  const season = winter
    ? ["winter", "wintersemester", "ws", "wise"]
    : ["sommer", "sommersemester", "ss", "sose"];
  const letter = winter ? "w" : "s";
  const terms = [
    abbr,
    `${abbr}${short}${letter}`,
    `${abbr}${short}`,
    ...name.split(" "),
    year,
    short,
    ...season,
    `${letter}${short}`,
    `${letter}${year}`,
  ];
  return words.every(
    w => terms.some(t => t.startsWith(w)) || (w.length >= 4 && name.replace(/ /g, "").includes(w))
  );
}

/**
 * Anzeige-Filter der Planungsansicht: Wochentage, Pausen und Semestergruppen.
 * Der Zustand liegt im viewStore (und damit im Link der Ansicht).
 *
 * @returns Reaktive Filter und Funktionen zum Ändern
 */
export function useViewFilters() {
  const viewStore = useViewStore();
  const { view } = storeToRefs(viewStore);
  const studyGroupStore = useStudyGroupStore();
  const { studyGroupList } = storeToRefs(studyGroupStore);

  /** Sichtbare Wochentage */
  const selectedWeekdays = computed({
    get: () => weekdays.map(w => w.value).filter(day => !view.value.hiddenWeekdays.includes(day)),
    set: (value: WeekDays[]) => {
      viewStore.patch({
        hiddenWeekdays: weekdays.map(w => w.value).filter(day => !value.includes(day)),
      });
    },
  });

  function toggleWeekday(day: WeekDays) {
    selectedWeekdays.value = selectedWeekdays.value.includes(day)
      ? selectedWeekdays.value.filter(d => d !== day)
      : [...selectedWeekdays.value, day];
  }

  function resetWeekdays() {
    selectedWeekdays.value = weekdays.map(w => w.value);
  }

  const showBreaks = computed({
    get: () => view.value.showBreaks,
    set: (value: boolean) => viewStore.patch({ showBreaks: value }),
  });

  /** Kohorten-Filter der Liste (z. B. W25), nur für die Auswahl, nicht in der Ansicht */
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

  function isStudyGroupSelected(item: StudyGroup) {
    const studyGroup = studyGroupStore.readStudyGroup(item.id);
    if (!studyGroup) return false;
    return view.value.studyGroups.includes(studyGroup.id);
  }

  function toggleStudyGroup(id: number) {
    const studyGroup = studyGroupStore.readStudyGroup(id);
    if (!studyGroup) return;

    viewStore.update(({ studyGroups }) => ({
      studyGroups: studyGroups.includes(studyGroup.id)
        ? studyGroups.filter(g => g !== studyGroup.id)
        : [...studyGroups, studyGroup.id],
    }));
  }

  function resetSelectedStudyGroup() {
    viewStore.patch({ studyGroups: [] });
  }

  const selectedStudyGroupCount = computed(() => view.value.studyGroups.length);

  function getDisplayName(studyGroup: StudyGroup) {
    return `${studyGroup.degreeProgram.abbreviation}${studyGroup.semesterYear % 100}_${studyGroup.semesterSeason.charAt(0).toUpperCase()}`;
  }

  return {
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
  };
}
