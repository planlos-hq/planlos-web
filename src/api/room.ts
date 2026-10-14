import { useNotification } from "@/composables/useNotification";
import type { Room } from "@/models/Room";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Speichert den Raum persistent in der Datenbank
 *
 * @param number - Raumnummer
 * @param name - Name des Raumes
 * @param seats - Sitzanzahl des Raumes
 *
 * @returns - Gibt den neu erstellten Raum oder undefined zurück
 */
export async function createRoomApi(
  number: string,
  name?: string,
  seats?: number,
  extraData?: Record<string, string>
) {
  try {
    const response = await fetch(`${API_BASE_URL}/room`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number,
        name,
        seats,
        extra_data: extraData,
      }),
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const room: Room = await response.json();
    return room;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt einen Raum anhand seiner ID aus der Datenbank
 *
 * @param id - Die eindeutige ID des Raumes
 * @returns Der gefundene Raum oder undefined, falls nicht vorhanden
 */
export async function getRoomApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/room/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const room: Room = await response.json();
    return room;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt alle Räume aus der Datenbank
 *
 * @returns - Gibt ein Array aller Räume zurück
 */
export async function listRoomsApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/room`, {
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
 * Aktualisiert einen existierenden Raum mit neuen Werten
 *
 * @param id - ID des zu aktualisierenden Raumes
 * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
 *
 * @returns - Gibt den aktualisierten Raum zurück oder undefined, falls ein Fehler auftritt
 */
export async function updateRoomApi(id: number, updates: Partial<Omit<Room, "id">>) {
  try {
    const response = await fetch(`${API_BASE_URL}/room/${id}`, {
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

    const room: Room = await response.json();
    return room;
  } catch (error) {
    throw error;
  }
}

/**
 * Löscht einen Raum aus der Datenbank
 *
 * @param id - ID des zu löschenden Raumes
 */
export async function deleteRoomApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/room/${id}`, {
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
