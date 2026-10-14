import type { Tab, WeekDays } from "@/enums/enums";

export type PlannerSettings = {
  hiddenWeekdays: WeekDays[];
  studyGroups: Set<number>;
  showBreaks: boolean;
  tab: Tab;
  selectedId: number | null;
  temp: boolean;
};
