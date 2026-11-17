export default {
  sections: {
    view: {
      title: "Ansicht",
      description: "Wochentage, Pausen und Semestergruppen der Planungsansicht.",
    },
    data: {
      title: "@:common.data",
      description: "Ressourcen importieren sowie den Stundenplan und Tabellen exportieren.",
    },
    backups: {
      title: "Sicherungen",
      description: "Die ganze Datenbank sichern, wiederherstellen oder leeren.",
    },
  },
  search: {
    view: { label: "@:settings.sections.view.title", terms: "anzeige" },
    weekdays: {
      label: "@:settings.view.weekdays",
      terms:
        "tage montag dienstag mittwoch donnerstag freitag samstag sonntag wochenende ausblenden",
    },
    breaks: { label: "@:settings.view.showBreaks", terms: "pause pausen mittag mittagspause" },
    groups: {
      label: "@:common.studyGroups",
      terms: "gruppen kohorte jahrgang studiengang auswahl filter sortieren",
    },
    data: { label: "@:settings.sections.data.title", terms: "import export" },
    import: {
      label: "Daten importieren",
      terms: "import csv excel xlsx hochladen upload datei",
    },
    exportPdf: {
      label: "Stundenplan als PDF exportieren",
      terms: "pdf drucken aushang export",
    },
    exportTables: {
      label: "Tabellen exportieren (CSV / Excel)",
      terms:
        "csv excel xlsx tabelle export herunterladen lehrpersonen räume studiengänge semestergruppen veranstaltungen",
    },
    backups: { label: "@:settings.sections.backups.title", terms: "backup datenbank dump sql" },
    backupsCreate: {
      label: "@:settings.backups.create",
      terms: "backup datenbank dump sql name herunterladen download",
    },
    backupsList: {
      label: "Sicherungen auf dem Server",
      terms: "backup liste wiederherstellen restore löschen herunterladen",
    },
    backupsFile: {
      label: "Sicherung aus Datei wiederherstellen",
      terms: "backup zip hochladen upload datei restore import dump",
    },
    backupsClear: {
      label: "@:settings.backups.clear",
      terms: "löschen zurücksetzen truncate alles leer reset",
    },
  },
  page: {
    title: "@:common.settings",
    navLabel: "Bereiche der Einstellungen",
    searchLabel: "Einstellungen durchsuchen, z. B. Wochentage, PDF oder Import",
    firstResult: "Zum ersten Treffer",
    results: "Treffer",
    noResults: "Keine Treffer für „{query}“",
    general: "Allgemein",
    exporting: "Exportieren",
  },
  import: {
    description:
      "Lade eine CSV- oder Excel-Datei (.xlsx) hoch. Der Typ wird anhand der Kopfzeile automatisch erkannt.",
    submitting: "Wird importiert…",
    success: "Import erfolgreich abgeschlossen.",
    successToast: "Daten erfolgreich importiert!",
    importError: "Fehler beim Import ({status})",
    serverError: "Serverfehler ({status}). Bitte erneut versuchen.",
    failedToast: "Import fehlgeschlagen.",
    networkError: "Netzwerkfehler beim Import.",
  },
  dropZone: {
    prompt: "Datei hierher ziehen oder klicken zum Auswählen",
  },
  export: {
    groups: { view: "Diese Ansicht", data: "@:common.data" },
    entries: {
      pdf: {
        label: "Stundenplan als PDF",
        description:
          "Die Planungsansicht, wie sie gerade angezeigt wird, zum Drucken oder Aushängen.",
      },
      tables: {
        label: "Tabellen",
        description:
          "Ressourcen zum Bearbeiten in Excel oder für andere Systeme, auch wieder importierbar.",
      },
    },
    options: { resource: "@:common.data", format: "Format" },
    resources: {
      lecturer: "@:common.lecturers",
      room: "@:common.rooms",
      degreeProgram: "@:common.degreePrograms",
      studyGroup: "@:common.studyGroups",
      course: "@:common.courses",
    },
    formats: { xlsx: "Excel (.xlsx)", csv: "CSV" },
    serverError: "Der Server antwortet mit Fehler {status}.",
    networkError: "Netzwerkfehler: Server nicht erreichbar.",
  },
  backups: {
    create: "Sicherung erstellen",
    createDescription:
      "Eine Sicherung enthält alle Daten (ohne Zugriffsrechte). Sie wird heruntergeladen und zusätzlich auf dem Server abgelegt.",
    namePlaceholder: "Name der Sicherung (optional)",
    serverTitle: "Auf dem Server",
    empty: "Noch keine Sicherungen vorhanden.",
    unnamed: "Ohne Namen",
    restore: "Wiederherstellen",
    restoring: "Wird wiederhergestellt…",
    fileTitle: "Aus Datei wiederherstellen",
    fileDescription:
      "Lade eine heruntergeladene Sicherung (.zip) hoch. Alle aktuellen Daten werden ersetzt; der jetzige Stand wird vorher auf dem Server gesichert.",
    clear: "Datenbank leeren",
    clearDescription:
      "Löscht alle Daten (Zugriffsrechte bleiben). Vorher wird automatisch eine Sicherung erstellt und heruntergeladen.",
    sort: { date: "Datum" },
    loadFailed: "Sicherungen konnten nicht geladen werden.",
    failed: "Sicherung fehlgeschlagen",
    created: "Sicherung erstellt und heruntergeladen.",
    restored: "Sicherung wiederhergestellt.",
    cleared: "Datenbank geleert. Die Sicherung wurde heruntergeladen.",
    replaceWarning:
      "Alle aktuellen Daten werden ersetzt. Der jetzige Stand wird vorher automatisch auf dem Server gesichert.",
    clearWarning:
      "Alle Daten werden gelöscht. Der jetzige Stand wird vorher auf dem Server gesichert und heruntergeladen.",
    clearSubject: "Alle Veranstaltungen, Termine, Lehrpersonen, Räume und Semestergruppen",
    restoreAction: "die Sicherung wiederherzustellen",
    deleteAction: "die Sicherung zu löschen",
    clearAction: "alle Daten zu löschen",
    restoreDialogTitle: "Sicherung wiederherstellen?",
    deleteDialogTitle: "Sicherung löschen?",
    clearDialogTitle: "Datenbank leeren?",
    fileDialogTitle: "Aus Datei wiederherstellen?",
    autoBeforeRestore: "Automatisch vor dem Wiederherstellen",
    autoBeforeClear: "Automatisch vor dem Leeren der Datenbank",
    tooLargeTitle: "Datei zu groß",
    tooLarge: "Sicherungen dürfen höchstens 15 MB groß sein.",
  },
  view: {
    language: "Sprache",
    weekdays: "Wochentage",
    showAllWeekdays: "Alle Wochentage anzeigen",
    visibleWeekdays: "Sichtbare Wochentage",
    lastWeekdayHint: "{day}: mindestens ein Tag bleibt sichtbar",
    showBreaks: "Pausenzeiten anzeigen",
    studyGroups: "@:common.studyGroups",
    selectedCount: "{selected} von {total}",
    filterBySemester: "Nach Kohorte filtern",
    onlySelected: "Nur ausgewählte",
    sort: {
      year: "Jahrgang",
      degreeProgram: "@:common.degreeProgram",
      selectedFirst: "Ausgewählte zuerst",
    },
  },
};
