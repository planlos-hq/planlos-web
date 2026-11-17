import type de from "../de/templatePopUp";

const en: typeof de = {
  title: "Manage templates",
  addQuestion: "Add a template?",
  list: {
    searchLabel: "Search templates",
    add: "Add template",
    empty: "No templates yet.",
    noMatch: "No template found.",
    delete: "Delete template {name}",
  },
  form: {
    createTitle: "Create new template",
    editTitle: "Edit template",
    selected: "Selected ({count})",
    nothingSelected: "Nothing selected yet.",
    remove: "Remove {label}",
    saving: "Saving…",
    missingCourse: "Course {id} – no longer exists",
  },
  overlay: {
    cancelCreateTitle: "Cancel creating the template?",
    discardTitle: "Discard changes?",
    discardLine: "Unsaved input will be lost.",
    keepEditing: "Keep editing",
    discard: "Discard",
    deleteLine: "The template “{name}” will be permanently deleted.",
    deleteEffect: "This also affects existing assignments.",
    deleteDirty: "Unsaved changes will also be lost.",
    nameRequired: "Please enter a name.",
    noChanges: "No changes.",
  },
};

export default en;
