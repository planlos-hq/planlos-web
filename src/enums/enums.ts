export enum Department {
  AI = "Automatisierung und Informatik",
  VW = "Verwaltungswissenschaften",
  WW = "Wirtschaftswissenschaften",
}

export enum SemesterSeason {
  WINTER = "winter",
  SUMMER = "summer",
}

export enum WeekDays {
  MONTAG = "mon",
  DIENSTAG = "tue",
  MITTWOCH = "wed",
  DONNERSTAG = "thu",
  FREITAG = "fri",
  SAMSTAG = "sat",
  SONNTAG = "sun",
}

export enum Tab {
  LECTURER = "lecturer",
  STUDYGROUP = "studyGroup",
  ROOM = "room",
  DEGREEPROGRAM = "degreeProgram",
  COURSE = "course",
}

export enum LecturerKind {
  REGULAR = "regular",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  LAB_ENGINEER = "lab_engineer",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ADJUNCT_PROFESOR = "adjunct_professor",
}

/** Zuordnung der Lehrpersonen-Art zu den i18n-Keys der Anzeigetexte. */
export const lecturerKindKey: Record<LecturerKind, string> = {
  [LecturerKind.REGULAR]: "lecturerKind.regular",
  [LecturerKind.LAB_ENGINEER]: "lecturerKind.labEngineer",
  [LecturerKind.ADJUNCT_PROFESOR]: "lecturerKind.adjunctProfessor",
};

/**
 * Fehlercodes, die angezeigt werden, wenn keine Verbindung zum Server möglich ist.
 */
export enum ConnectionErrorCode {
  /** Der Server ist nicht erreichbar (Netzwerkfehler, Server offline) */
  ServerUnreachable = "PL-001",
  /** Der Server antwortet mit einem 5xx-Status, z. B. weil die Datenbank nicht erreichbar ist */
  ServerError = "PL-002",
  /** Der Server antwortet, aber die Antwort ist kein gültiges JSON (z. B. Fehlerseite eines Proxys) */
  InvalidResponse = "PL-003",
}
