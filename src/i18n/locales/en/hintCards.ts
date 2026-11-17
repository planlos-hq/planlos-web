import type de from "../de/hintCards";

const en: typeof de = {
  accessDeniedHint: {
    title: "No access",
    notEnabled: "This account has not been enabled for PlanLos.",
    goToAdmin: "Please contact the administrator.",
    accountNotApproved: "The account {username} has not been enabled for PlanLos.",
  },
  connectionErrorHint: {
    title: "No connection to the server",
    serverNotReachable:
      "The server is currently unreachable. Please try again later or contact the administrator.",
    connectionError: "Error code: {code}",
  },
  loadingHint: {
    title: "Loading data",
    body: "One moment, PlanLos is fetching the data from the server.",
    spinnerLabel: "Loading",
  },
  noSelectionHint: {
    lecturer: {
      title: "No lecturer selected",
      body: "Select a lecturer on the left to see their timetable.",
    },
    studyGroup: {
      title: "No study group selected",
      body: "Select a study group on the left to see its timetable.",
    },
    degreeProgram: {
      title: "No degree program selected",
      body: "Select a degree program on the left to see the timetables of its study groups.",
    },
    room: {
      title: "No room selected",
      body: "Select a room on the left to see its schedule.",
    },
  },
  noStudyGroupsHint: {
    title: "No study groups selected",
    body: "Select which study groups you want to plan.",
    action: "Select study groups",
  },
};

export default en;
