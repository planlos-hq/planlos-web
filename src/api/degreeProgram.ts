import { useNotification } from "@/composables/useNotification";
import type { DegreeProgram } from "@/models/DegreeProgram";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Speichert den Studiengang persistent in der Datenbank
 *
 * @param name - Name des Studiengangs
 * @param abbreviation - Kürzel des Studiengangs
 *
 * @returns - Gibt den neu erstellten Studiengang oder undefined zurück
 */
export async function createDegreeProgramApi(
  name: string,
  abbreviation: string,
  extraData?: Record<string, string>
) {
  try {
    const response = await fetch(`${API_BASE_URL}/degree-program`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        abbreviation: abbreviation,
        extra_data: extraData,
      }),
    });
    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const degreeProgram: DegreeProgram = await response.json();
    return degreeProgram;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt einen Studiengang anhand seiner ID aus der Datenbank
 *
 * @param id - Die eindeutige ID des Studiengangs
 * @returns Der gefundene Studiengang oder undefined, falls nicht vorhanden
 */
export async function getDegreeProgramApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/degree-program/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const degreeProgram: DegreeProgram = await response.json();
    return degreeProgram;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt alle Studiengänge aus der Datenbank.
 *
 * @returns - Gibt ein Array aller Studiengänge zurück
 */
export async function listDegreeProgramsApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/degree-program`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const degreePrograms: DegreeProgram[] = await response.json();
    return degreePrograms;
  } catch (error) {
    throw error;
  }
}

/**
 * Aktualisiert einen existierenden Studiengang mit neuen Werten
 *
 * @param id - ID des zu aktualisierenden Studiengangs
 * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
 *
 * @returns Der aktualisierte Studiengang oder undefined, falls die Aktualisierung fehlschlägt
 */
export async function updateDegreeProgramApi(
  id: number,
  updates: Partial<Omit<DegreeProgram, "id">>
) {
  try {
    const response = await fetch(`${API_BASE_URL}/degree-program/${id}`, {
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

    const degreeProgram: DegreeProgram = await response.json();
    return degreeProgram;
  } catch (error) {
    throw error;
  }
}

/**
 * Löscht einen Studiengang aus der Datenbank
 *
 * @param id - ID des zu löschenden Studiengangs
 */
export async function deleteDegreeProgramApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/degree-program/${id}`, {
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
