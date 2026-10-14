import { useNotification } from "@/composables/useNotification";
import type { LecturerApiData } from "./types";
import type { LecturerKind } from "@/enums/enums";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Speichert einen Dozenten persistent in der Datenbank.
 *
 * @param firstName - Vorname
 * @param lastName - Nachname
 * @param abbreviation - Kürzel des Dozenten (optional)
 * @param notes - Notizen für den Dozenten (optional)
 * @param labEngineer - Unterscheidung ob Dozent oder Laboringenieur (optional)
 * @param isRelevant - Ist der Lecturer noch im System relevant (optional)
 * @returns - Gibt den neu erstellten Dozenten oder undefined zurück
 */
export async function createLecturerApi(
  firstName: string,
  lastName: string,

  kind: LecturerKind,
  abbreviation: string,
  notes?: string,
  isRelevant?: boolean,
  extraData?: Record<string, string>
) {
  try {
    const response = await fetch(`${API_BASE_URL}/lecturer`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        abbreviation: abbreviation,
        kind: kind,
        notes: notes,
        is_relevant: isRelevant,
        extra_data: extraData,
      }),
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const lecturer: LecturerApiData = await response.json();
    return lecturer;
  } catch (error) {
    throw error;
  }
}

/**
 * Aktualisiert einen Dozenten.
 *
 * @param id - ID des zu aktualisierenden Dozenten
 * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
 *
 * @returns - Gibt den aktualisierten Dozenten zurück oder undefined, falls ein Fehler auftritt
 */
export async function updateLecturerApi(
  id: number,
  updates: Partial<Omit<LecturerApiData, "id">>
): Promise<LecturerApiData> {
  try {
    const response = await fetch(`${API_BASE_URL}/lecturer/${id}`, {
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

    const lecturer: LecturerApiData = await response.json();
    return lecturer;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt einen Dozenten anhand seiner ID aus der Datenbank.
 *
 * @param id - Die eindeutige ID des Dozenten
 * @returns Der gefundene Dozent oder undefined, falls nicht vorhanden
 */
export async function getLecturerApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/lecturer/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const lecturer: LecturerApiData = await response.json();
    return lecturer;
  } catch (error) {
    throw error;
  }
}
/**
 * Löscht einen Dozenten aus der Datenbank
 *
 * @param id - ID des zu löschenden Dozenten
 */
export async function deleteLecturerApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/lecturer/${id}`, {
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

/**
 * Lädt alle vorhandenen Dozenten aus der Datenbank.
 *
 * @returns Array aller existierender Dozent.
 */
export async function listLecturersApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/lecturer`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const lecturers: LecturerApiData[] = await response.json();
    return lecturers;
  } catch (error) {
    throw error;
  }
}
