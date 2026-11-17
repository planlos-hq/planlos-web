import type de from "../de/settings";

const en: typeof de = {
  sections: {
    view: {
      title: "View",
      description: "Weekdays, breaks and study groups of the planning view.",
    },
    data: {
      title: "@:common.data",
      description: "Import resources and export the timetable and tables.",
    },
    backups: {
      title: "Backups",
      description: "Back up, restore or clear the whole database.",
    },
  },
  search: {
    view: { label: "@:settings.sections.view.title", terms: "display" },
    weekdays: {
      label: "@:settings.view.weekdays",
      terms: "days monday tuesday wednesday thursday friday saturday sunday weekend hide",
    },
    breaks: { label: "@:settings.view.showBreaks", terms: "break breaks lunch lunchbreak" },
    groups: {
      label: "@:common.studyGroups",
      terms: "groups semester year degree program selection filter sort",
    },
    data: { label: "@:settings.sections.data.title", terms: "import export" },
    import: {
      label: "Import data",
      terms: "import csv excel xlsx upload file",
    },
    exportPdf: {
      label: "Export timetable as PDF",
      terms: "pdf print poster export",
    },
    exportTables: {
      label: "Export tables (CSV / Excel)",
      terms:
        "csv excel xlsx table export download lecturers rooms degree programs study groups courses",
    },
    backups: { label: "@:settings.sections.backups.title", terms: "backup database dump sql" },
    backupsCreate: {
      label: "@:settings.backups.create",
      terms: "backup database dump sql name download",
    },
    backupsList: {
      label: "Backups on the server",
      terms: "backup list restore delete download",
    },
    backupsFile: {
      label: "Restore backup from file",
      terms: "backup zip upload file restore import dump",
    },
    backupsClear: {
      label: "@:settings.backups.clear",
      terms: "delete reset truncate everything empty clear",
    },
  },
  page: {
    title: "@:common.settings",
    navLabel: "Settings sections",
    searchLabel: "Search settings, e.g. weekdays, PDF or import",
    firstResult: "Go to first result",
    results: "Results",
    noResults: "No results for “{query}”",
    general: "General",
    exporting: "Export",
  },
  import: {
    description:
      "Upload a CSV or Excel file (.xlsx). The type is detected automatically from the header row.",
    submitting: "Importing…",
    success: "Import completed successfully.",
    successToast: "Data imported successfully!",
    importError: "Error during import ({status})",
    serverError: "Server error ({status}). Please try again.",
    failedToast: "Import failed.",
    networkError: "Network error during import.",
  },
  dropZone: {
    prompt: "Drag a file here or click to select",
  },
  export: {
    groups: { view: "This view", data: "@:common.data" },
    entries: {
      pdf: {
        label: "Timetable as PDF",
        description:
          "The planning view as currently displayed, for printing or putting up on a wall.",
      },
      tables: {
        label: "Tables",
        description: "Resources for editing in Excel or other systems. They can be imported again.",
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
    serverError: "The server responded with error {status}.",
    networkError: "Network error: server unreachable.",
  },
  backups: {
    create: "Create backup",
    createDescription:
      "A backup contains all data (excluding access permissions). It is downloaded and also stored on the server.",
    namePlaceholder: "Backup name (optional)",
    serverTitle: "On the server",
    empty: "No backups yet.",
    unnamed: "Unnamed",
    restore: "Restore",
    restoring: "Restoring…",
    fileTitle: "Restore from file",
    fileDescription:
      "Upload a downloaded backup (.zip). All current data will be replaced; the current state is backed up on the server first.",
    clear: "Clear database",
    clearDescription:
      "Deletes all data (access permissions are kept). A backup is created and downloaded automatically beforehand.",
    sort: { date: "Date" },
    loadFailed: "Backups could not be loaded.",
    failed: "Backup failed",
    created: "Backup created and downloaded.",
    restored: "Backup restored.",
    cleared: "Database cleared. The backup was downloaded.",
    replaceWarning:
      "All current data will be replaced. The current state is automatically backed up on the server first.",
    clearWarning:
      "All data will be deleted. The current state is backed up on the server and downloaded first.",
    clearSubject: "All courses, events, lecturers, rooms and study groups",
    restoreAction: "restore the backup",
    deleteAction: "delete the backup",
    clearAction: "delete all data",
    restoreDialogTitle: "Restore backup?",
    deleteDialogTitle: "Delete backup?",
    clearDialogTitle: "Clear database?",
    fileDialogTitle: "Restore from file?",
    autoBeforeRestore: "Automatically before restoring",
    autoBeforeClear: "Automatically before clearing the database",
    tooLargeTitle: "File too large",
    tooLarge: "Backups must not exceed 15 MB.",
  },
  view: {
    language: "Language",
    weekdays: "Weekdays",
    showAllWeekdays: "Show all weekdays",
    visibleWeekdays: "Visible weekdays",
    lastWeekdayHint: "{day}: at least one day must stay visible",
    showBreaks: "Show breaks",
    studyGroups: "@:common.studyGroups",
    selectedCount: "{selected} of {total}",
    filterBySemester: "Filter by semester",
    onlySelected: "Selected only",
    sort: {
      year: "Year",
      degreeProgram: "@:common.degreeProgram",
      selectedFirst: "Selected first",
    },
  },
};

export default en;
