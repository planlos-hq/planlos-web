import type de from "../de/conflictsPopUp";

const en: typeof de = {
  title: "Resource conflicts",
  filterAll: "All",
  statusAll: "All",
  active: "Active",
  ignored: "Ignored",
  none: "No conflicts",
  labEngineers:
    "Only one lab engineer, no other lecturer | Only {count} lab engineers, no other lecturer",
  timeHard: "Scheduled at a time the lecturer is unavailable",
  timeSoft: "Scheduled at a time the lecturer would rather avoid",
  hints: {
    allResources: "Show all resources",
    lecturer: "Lecturer",
    studyGroup: "Study group",
    room: "Room",
    allStatuses: "Show active and ignored conflicts",
    active: "Show only active conflicts",
    ignored: "Show only ignored conflicts",
    course: "Course",
    courses: "Affected courses",
    time: "Overlap",
    labEngineer: "Only lab engineers assigned",
    showInCalendar: "Show in calendar",
    showLabEngineer: "Show the lab engineer's calendar",
    ignore: "Ignore conflict",
    reactivate: "Reactivate conflict",
    slotTime: "Time of the slot",
    unavailable: "Unavailable time of the lecturer (set in the lecturer dialog)",
    showLecturerCalendar: "Show the lecturer's calendar",
  },
  errors: {
    title: "Error",
    notFound: "Conflict could not be found.",
    loadFailed: "Resource conflicts could not be loaded.",
    loadIgnoredFailed: "Ignored resource conflicts could not be loaded.",
    loadLabEngineersFailed: "Courses with only lab engineers could not be loaded.",
    loadOneFailed: "Error while loading the conflict.",
    updateFailed: "An error occurred while updating the conflict.",
    loadTimeFailed: "Slots at unavailable times could not be loaded.",
  },
};

export default en;
