/** Zeitraum, in dem eine Lehrperson nicht verfügbar ist */
export type LecturerTimeConstraint = {
  id: number;
  lecturer: number;
  /** 0 = Sonntag, ..., 6 = Samstag (wie Date.getDay() und die Termine) */
  weekday: number;
  /** Beginn in Minuten ab Mitternacht */
  from: number;
  /** Ende in Minuten ab Mitternacht */
  to: number;
  /** true: möglichst vermeiden, false: nicht verfügbar */
  soft: boolean;
};
