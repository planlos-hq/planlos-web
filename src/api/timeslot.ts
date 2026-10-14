import type { Room } from "@/models/Room";
import type { TimeSlotApiData, TimeSlotRoomAssignment } from "./types";
import { useNotification } from "@/composables/useNotification";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Erstellt einen neuen TimeSlot
 *
 * @param course - Id des zugehörigen Kurses
 * @param weekday - Wochentag (0..6)
 * @param at - Startzeit des Zeitslots
 * @param duration - Dauer des Zeitslots
 * @returns gibt ein TimeSlot zurück
 */
export async function createTimeSlotApi(
  course: number,
  weekday: number,
  at: string,
  duration: string
): Promise<TimeSlotApiData> {
  try {
    const response = await fetch(`${API_BASE_URL}/course-time-slot`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ course, weekday, at, duration }),
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const timeSlot: TimeSlotApiData = await response.json();
    return timeSlot;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt einen Zeitslot anhand ihrer ID aus der Datenbank.
 *
 * @param id - Die eindeutige ID des Zeitslots
 * @returns - Gefundener Zeitslot
 */
export async function getTimeSlotApi(id: number): Promise<TimeSlotApiData> {
  try {
    const response = await fetch(`${API_BASE_URL}/course-time-slot/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const timeSlot: TimeSlotApiData = await response.json();
    return timeSlot;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt alle Zeitslots aus der Datenbank.
 *
 * @returns - Gibt ein Array aller Zeitslots zurück
 */
export async function listTimeSlotsApi(): Promise<TimeSlotApiData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/course-time-slot`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const timeSlots: TimeSlotApiData[] = await response.json();
    return timeSlots;
  } catch (error) {
    throw error;
  }
}

/**
 * Aktualisiert einen existierenden Zeitslot.
 *
 * @param id - ID des zu aktualisierenden Zeitslots
 * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
 *
 * @returns - Gibt den aktualisierten Zeitslot zurück
 */
export async function updateTimeSlotApi(
  id: number,
  updates: Partial<Omit<TimeSlotApiData, "id">>
): Promise<TimeSlotApiData> {
  try {
    const response = await fetch(`${API_BASE_URL}/course-time-slot/${id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const timeSlot: TimeSlotApiData = await response.json();
    return timeSlot;
  } catch (error) {
    throw error;
  }
}

/**
 * Löscht einen Zeitslot aus der Datenbank.
 *
 * @param id - ID des zu löschenden Zeitslots
 */
export async function deleteTimeSlotApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course-time-slot/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }
  } catch (error) {
    throw error;
  }
}

// Endpunkte für Raumzuweisung:

/**
 * Speichert die Zuweisung eines Raums zu einem Zeitslot.
 *
 * @param timeSlotId - ID des Zeitslots
 * @param roomId - ID des Raums
 */
export async function assignRoomToTimeSlotApi(timeSlotId: number, roomId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course-time-slot/${timeSlotId}/room/${roomId}`, {
      method: "POST",
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt alle Räume eines Veranstaltungs-Zeitslots aus der Datenbank.
 *
 * @param timeSlotId - ID des Zeitslots
 * @returns Array aller Räume eines Veranstaltung-Zeitslots.
 */
export async function getTimeSlotRoomsApi(timeSlotId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course-time-slot/${timeSlotId}/rooms`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const rooms: Room[] = await response.json();
    return rooms;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt alle Zuweisungen von Räumen zu Veranstaltungs-Zeitslots aus der Datenbank.
 *
 * @returns alle Zuweisungen von Räumen zu Veranstaltungs-Zeitslots
 */
export async function listTimeSlotRoomAssignmentsApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/course-time-slot/rooms`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const assignments: TimeSlotRoomAssignment[] = await response.json();
    return assignments;
  } catch (error) {
    throw error;
  }
}

/**
 * Die Zuweisung eines Raums zu einem Veranstaltungs-Zeitslot aufheben.
 *
 * @param timeSlotId - ID des Zeitslots
 * @param roomId - ID des Raums
 */
export async function removeRoomFromTimeSlotApi(timeSlotId: number, roomId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course-time-slot/${timeSlotId}/room/${roomId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }
  } catch (error) {
    throw error;
  }
}
