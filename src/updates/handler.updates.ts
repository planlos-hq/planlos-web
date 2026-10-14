import { handleColor } from "./color.updates";
import {
  handleCourse,
  handleCourseColor,
  handleCourseLecturer,
  handleCourseStudyGroup,
} from "./course.updates";
import { handleDegreeProgram } from "./degreeProgram.updates";
import { handleLecturer } from "./lecturer.updates";
import { handleRoom } from "./room.updates";
import { handleStudyGroup } from "./studyGroup.updates";
import { handleStudyGroupTemplate, handleStudyGroupTemplateCourse } from "./template.updates";
import { handleCourseTimeSlot, handleTimeSlotRoom } from "./timeslot.updates";
import type { UpdateData } from "./types.updates";

export function handleUpdate(data: UpdateData) {
  switch (data.resource) {
    case "courseTimeSlot":
      handleCourseTimeSlot(data.operation, data.data);
      break;
    case "timeSlotRoomAssignment":
      handleTimeSlotRoom(data.operation, data.data);
      break;
    case "courseLecturer":
      handleCourseLecturer(data.operation, data.data);
      break;
    case "courseStudyGroup":
      handleCourseStudyGroup(data.operation, data.data);
      break;
    case "courseColorAssignment":
      handleCourseColor(data.operation, data.data);
      break;
    case "course":
      handleCourse(data.operation, data.data);
      break;
    case "lecturer":
      handleLecturer(data.operation, data.data);
      break;
    case "room":
      handleRoom(data.operation, data.data);
      break;
    case "degreeProgram":
      handleDegreeProgram(data.operation, data.data);
      break;
    case "studyGroup":
      handleStudyGroup(data.operation, data.data);
      break;
    case "courseColor":
      handleColor(data.operation, data.data);
      break;
    case "studyGroupTemplate":
      handleStudyGroupTemplate(data.operation, data.data);
      break;
    case "studyGroupTemplateCourse":
      handleStudyGroupTemplateCourse(data.operation, data.data);
      break;
  }
}
