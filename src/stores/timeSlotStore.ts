import { defineStore } from "pinia";
import type { TimeSlot } from "@/models/TimeSlot";
import {
  assignRoomToTimeSlotApi,
  getTimeSlotRoomsApi,
  removeRoomFromTimeSlotApi,
} from "@/api/timeslot";
import { calculateDuration, mapTimeSlotUpdatesToApi, transformStartDate } from "@/api/util";
import { useNotification } from "@/composables/useNotification";
import { timeSlotResource, timeSlotRoomResource, useUndoStore } from "@/stores/undoStore";
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
    const undoStore = useUndoStore();
    try {
      await undoStore.perform("Termin anlegen", [
        {
          kind: "create",
          resource: timeSlotResource,
          data: {
            course: courseId,
            weekday: start.getDay(),
            at: transformStartDate(start),
            duration: calculateDuration(start, end),
          },
        },
      ]);
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

  // TODO: Der aktuelle Rollback deckt nur einzelne Fehler sauber ab. Offen:
  //  - fetch ohne Timeout: hängender Request zeigt ungespeicherten Stand ohne Rückmeldung
  //  - bei Fehler statt Snapshot den Server-Stand nachladen (getTimeSlotApi), sonst gehen
  //    erfolgreiche/fremde Änderungen lokal verloren; Zähler pro Slot gegen Überholen
  //  - SSE-Handler übernimmt Echos blind, ältere Echos überschreiben kurz neuere Änderungen

  /**
   * Aktualisiert einen existierenden TimeSlot mit neuen Werten
   *
   * @param id - eindeutige ID des TimeSlots
   * @param updates - neue Werte für das TimeSlot-Objekt (ohne ID)
   * @param label - Bezeichnung im Rückgängig-Verlauf
   */
  async function updateTimeSlot(
    id: number,
    updates: Partial<Omit<TimeSlot, "id">>,
    label = "Termin ändern"
  ) {
    const undoStore = useUndoStore();
    const timeSlot = readTimeSlot(id);
    if (!timeSlot) {
      handleError(
        Error("TimeSlot existiert lokal nicht."),
        "Fehler beim Aktualisieren des Zeitslots"
      );
      return;
    }

    const apiUpdates = mapTimeSlotUpdatesToApi(updates, timeSlot);
    const previous = { start: timeSlot.start, end: timeSlot.end };

    // optimistisch aktualisiert: Kalender zeigt die Änderung sofort (muss vor dem ersten await passieren)
    Object.assign(timeSlot, updates);
    try {
      await undoStore.perform(label, [
        {
          kind: "update",
          resource: timeSlotResource,
          id,
          set: apiUpdates,
        },
      ]);
    } catch (error) {
      Object.assign(timeSlot, previous);
      handleError(error as Error, "Fehler beim Aktualisieren des Zeitslots");
    }
  }

  /**
   * Löscht ein TimeSlot anhand der ID
   *
   * @param id - eindeutige ID des TimeSlots
   */
  async function deleteTimeSlot(id: number) {
    const undoStore = useUndoStore();
    try {
      const timeSlot = readTimeSlot(id);
      //Verhindert doppeltes Löschen bei Server-Sent-Events
      if (!timeSlot) {
        return;
      }
      // Räume im selben Schritt löschen, damit Rückgängig sie wiederherstellt
      await undoStore.perform("Termin löschen", [
        ...timeSlot.rooms.map(room => ({
          kind: "delete" as const,
          resource: timeSlotRoomResource,
          data: { time_slot: id, room: room.id },
        })),
        { kind: "delete", resource: timeSlotResource, id },
      ]);
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Löschen des Zeitslots.");
    }
  }

  /**
   * Weist einem TimeSlot einen Raum zu bzw. entfernt die Zuweisung.
   *
   * @param timeSlotId - ID des Zeitslots
   * @param roomId - ID des Raums
   * @param assign - true: zuweisen, false: entfernen
   */
  async function setRoomAssignment(timeSlotId: number, roomId: number, assign: boolean) {
    const undoStore = useUndoStore();
    const data = { time_slot: timeSlotId, room: roomId };
    try {
      await undoStore.perform(assign ? "Raum zuweisen" : "Raum entfernen", [
        { kind: assign ? "create" : "delete", resource: timeSlotRoomResource, data },
      ]);
    } catch (error) {
      handleError(error as Error, "Fehler bei der Raumzuweisung.");
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
    setRoomAssignment,
    updateRoomAssignmentsForTimeSlot,
    setTimeSlots,
  };
});
