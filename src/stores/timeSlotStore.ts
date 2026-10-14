import { defineStore } from "pinia";
import type { TimeSlot } from "@/models/TimeSlot";
import {
  assignRoomToTimeSlotApi,
  createTimeSlotApi,
  deleteTimeSlotApi,
  getTimeSlotRoomsApi,
  removeRoomFromTimeSlotApi,
  updateTimeSlotApi,
} from "@/api/timeslot";
import { calculateDuration, mapTimeSlotUpdatesToApi, transformStartDate } from "@/api/util";
import { useNotification } from "@/composables/useNotification";
import type { Room } from "@/models/Room";
import type { Course } from "@/models/Course";
import { ref } from "vue";

/**
 * Pinia Store für die Verwaltung von TimeSlots
 *
 * @returns Ein Objekt mit:
 * - createTimeSlot: Funktion zum Erstellen eines neuen TimeSlots
 * - readTimeSlot: Funktion zum Abrufen eines TimeSlots per ID
 * - updateTimeSlot: Funktion zum Aktualisieren eines TimeSlots
 * - deleteTimeSlot: Funktion zum Löschen eines TimeSlots
 */
export const useTimeSlotStore = defineStore("timeSlots", () => {
  const { handleError } = useNotification();
  const timeSlotMap = ref<Map<number, TimeSlot>>(new Map<number, TimeSlot>());
  /**
   * Key: timeSlotId, Value: courseId
   */
  const timeSlotCourseAssignmentsMap = ref<Map<number, number>>(new Map<number, number>());
  /**
   * Erstellt persistent einen neuen TimeSlot
   *
   * @param start - Startpunkt
   * @param end - Endpunkt
   * @returns gibt ein TimeSlot-Objekt zurück
   */
  async function createTimeSlot(courseId: number, start: Date, end: Date) {
    try {
      await createTimeSlotApi(
        courseId,
        start.getDay(),
        transformStartDate(start),
        calculateDuration(start, end)
      );
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Erstellen des Zeitslots.");
    }
  }

  /**
   * Sucht ein TimeSlot anhand der ID
   *
   * @param id - eindeutige ID des TimeSlots
   * @returns gibt ein bestimmtes TimeSlot-Objekt zurück oder undefined, falls nichts gefunden wurde
   */
  function readTimeSlot(id: number): TimeSlot | undefined {
    const timeSlot = timeSlotMap.value.get(id);
    return timeSlot;
  }

  /**
   * Aktualisiert einen existierenden TimeSlot mit neuen Werten
   *
   * @param id - eindeutige ID des TimeSlots
   * @param updates - neue Werte für das TimeSlot-Objekt (ohne ID)
   * @param timeSlots - Liste der TimeSlots
   */
  async function updateTimeSlot(id: number, updates: Partial<Omit<TimeSlot, "id">>) {
    try {
      const oldTimeSlot = readTimeSlot(id);
      if (!oldTimeSlot) throw Error("TimeSlot existiert lokal nicht.");

      const apiUpdates = mapTimeSlotUpdatesToApi(updates, oldTimeSlot);
      await updateTimeSlotApi(id, apiUpdates);
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Aktualisieren des Zeitslots");
    }
  }

  /**
   * Löscht ein TimeSlot anhand der ID
   *
   * @param id - eindeutige ID des TimeSlots
   */
  async function deleteTimeSlot(id: number) {
    try {
      const timeSlot = readTimeSlot(id);
      //Verhindert doppeltes Löschen bei Server-Sent-Events
      if (!timeSlot) {
        return;
      }
      for (const room of timeSlot.rooms) {
        await removeRoomFromTimeSlotApi(id, room.id);
      }
      await deleteTimeSlotApi(id);
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Löschen des Zeitslots.");
    }
  }

  /**
   * Vergleicht die aktuelle Auswahl mit den vorhandenen Daten in der Datenbank und verändert bei Änderungen die Einträge.
   *
   * @param timeSlotId - ID des Zeitslots
   * @param rooms - ID des Raumes
   */
  async function updateRoomAssignmentsForTimeSlot(
    timeSlot: TimeSlot | undefined,
    rooms: Room[] | undefined,
    course: Course | undefined
  ) {
    try {
      if (!timeSlot) {
        throw new Error("Keine TimeSlotId vorhanden.");
      }
      if (!rooms) {
        throw new Error("Keine Räume vorhanden.");
      }
      if (!course) {
        throw new Error("Kein Kurs vorhanden.");
      }

      const apiRoomsForTimeSlot = await getTimeSlotRoomsApi(timeSlot.id);

      for (const r of rooms) {
        if (apiRoomsForTimeSlot.map(room => room.id).indexOf(r.id) === -1) {
          await assignRoomToTimeSlotApi(timeSlot.id, r.id);
        }
      }

      for (const apiR of apiRoomsForTimeSlot) {
        const index = rooms.map(r => r.id).indexOf(apiR.id);
        if (index === -1) {
          await removeRoomFromTimeSlotApi(timeSlot.id, apiR.id);
        }
      }
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler bei der Raumzuweisung.");
    }
  }

  function setTimeSlots(timeSlots: TimeSlot[], courseId: number) {
    for (const t of timeSlots) {
      timeSlotMap.value.set(t.id, t);
      timeSlotCourseAssignmentsMap.value.set(t.id, courseId);
    }
  }
  return {
    timeSlotMap,
    timeSlotCourseAssignmentsMap,
    createTimeSlot,
    readTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    updateRoomAssignmentsForTimeSlot,
    setTimeSlots,
  };
});
