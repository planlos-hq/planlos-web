import type { TimeSlotApiData, TimeSlotRoomAssignment } from "@/api/types";
import { useTimeSlotStore } from "@/stores/timeSlotStore";
import type { UpdateOperation } from "./types.updates";
import { useCourseStore } from "@/stores/courseStore";
import { mapApiTimeSlot } from "@/api/util";
import { useRoomStore } from "@/stores/roomStore";

export function handleCourseTimeSlot(operation: UpdateOperation, data: TimeSlotApiData | number) {
  const timeSlotStore = useTimeSlotStore();
  const courseStore = useCourseStore();

  const t = data as TimeSlotApiData;
  switch (operation) {
    case "update":
      const oldTimeSlot = timeSlotStore.readTimeSlot(t.id);
      if (!oldTimeSlot) {
        return;
      }
      const newTimeSlot = mapApiTimeSlot(t, oldTimeSlot?.rooms);

      oldTimeSlot.start = newTimeSlot.start;
      oldTimeSlot.end = newTimeSlot.end;
      break;
    case "create":
      const timeSlot = mapApiTimeSlot(t);
      const course = courseStore.readCourse(t.course);
      if (!course) {
        return;
      }
      timeSlotStore.timeSlotMap.set(timeSlot.id, timeSlot);
      courseStore.assignTimeSlotToCourse(course.id, timeSlot);
      break;
    case "delete":
      const id = data as number;
      timeSlotStore.timeSlotMap.delete(id);
      //Damit die Anzeige auf dem anderen Bildschirm entfernt wird, muss der TimeSlot aus dem zugehörigen Kurs entfernt werden.
      const courseId = timeSlotStore.timeSlotCourseAssignmentsMap.get(id);
      if (courseId === undefined) {
        return;
      }
      const c = courseStore.readCourse(courseId);
      if (c) {
        c.timeSlots = c.timeSlots.filter(t => t.id !== id);
      }
      timeSlotStore.timeSlotCourseAssignmentsMap.delete(id);
  }
}

//Zuweisung des Raumes zum TimeSlot
export function handleTimeSlotRoom(operation: UpdateOperation, data: TimeSlotRoomAssignment) {
  const timeSlotStore = useTimeSlotStore();
  const roomStore = useRoomStore();
  const r = roomStore.roomMap.get(data.room);
  const t = timeSlotStore.timeSlotMap.get(data.time_slot);

  if (!r || !t) {
    return;
  }
  const index = t.rooms.findIndex(room => room.id === r.id);

  switch (operation) {
    case "create":
      if (index !== -1) {
        return;
      }
      t.rooms.push(r);
      break;
    case "delete":
      if (index === -1) {
        return;
      }
      t.rooms.splice(index, 1);
      break;
  }
}
