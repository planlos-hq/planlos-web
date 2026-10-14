import { useNotification } from "@/composables/useNotification";
import type { Color } from "@/models/Color";
// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Speichert eine neue Farbe persistent in der Datenbank.
 *
 * @param name - Name der Farbe
 * @param hex - Hexcode der die Farbe beinhaltet
 * @returns - Gibt die neu erstellte Farbe oder undefined zurück
 */
export async function createCourseColorApi(name: string, hex: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/course-color`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        hex: hex,
      }),
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const color: Color = await response.json();
    return color;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt eine Farbe anhand ihrer ID aus der Datenbank.
 *
 * @param id - Die eindeutige ID der Farbe
 * @returns Die gefundene Farbe oder undefined, falls nicht vorhanden
 */
export async function getCourseColorApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course-color/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const color: Color = await response.json();
    return color;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt alle Farben aus der Datenbank.
 *
 * @returns - Gibt ein Array aller Farben zurück
 */
export async function listCourseColorsApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/course-color`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const colors: Color[] = await response.json();
    return colors;
  } catch (error) {
    throw error;
  }
}

/**
 * Aktualisiert eine existierende Farbe mit neuen Werten
 *
 * @param id - ID der zu aktualisierenden Farbe
 * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
 *
 * @returns - Gibt die aktualisierte Farbe zurück oder undefined, falls ein Fehler auftritt
 */
export async function updateCourseColorApi(id: number, updates: Partial<Omit<Color, "id">>) {
  try {
    const response = await fetch(`${API_BASE_URL}/course-color/${id}`, {
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

    const color: Color = await response.json();
    return color;
  } catch (error) {
    throw error;
  }
}

/**
 * Löscht eine Farbe aus der Datenbank
 *
 * @param id - ID der zu löschenden Farbe
 */
export async function deleteCourseColorApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course-color/${id}`, {
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
