import type { SemesterSeason } from "@/enums/enums";
import type { StudyGroupApiData } from "./types";
import { useNotification } from "@/composables/useNotification";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Speichert die Studiengruppe persistent in der Datenbank
 *
 * @param semesterSeason - Semester (Sommer oder Winter)
 * @param semesterYear - Jahr des Semesters
 * @param studentCount - Anzahl der Studierenden in der Gruppe
 * @param degreeProgramID - Zugehöriger Studiengang anhand seiner ID
 *
 * @returns - Gibt die neu erstellte Studiengruppe oder undefined zurück
 */
export async function createStudyGroupApi(
  semesterSeason: SemesterSeason,
  semesterYear: number,
  studentCount: number,
  degreeProgramID: number,
  extraData?: Record<string, string>
) {
  try {
    const body = {
      semester_season: semesterSeason,
      semester_year: semesterYear,
      student_count: studentCount,
      degree_program: degreeProgramID,
      extra_data: extraData,
    };
    const response = await fetch(`${API_BASE_URL}/study-group`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const studyGroup: StudyGroupApiData = await response.json();
    return studyGroup;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt eine Studiengruppe anhand ihrer ID aus der Datenbank
 *
 * @param id - Die eindeutige ID der Studiengruppe
 * @returns Die gefundene Studiengruppe oder undefined, falls nicht vorhanden
 */
export async function getStudyGroupApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/study-group/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const studyGroup: StudyGroupApiData = await response.json();
    return studyGroup;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt alle Studiengruppen aus der Datenbank
 *
 * @returns - Gibt ein Array aller Studiengruppen zurück
 */
export async function listStudyGroupsApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/study-group`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const studyGroups: StudyGroupApiData[] = await response.json();
    return studyGroups;
  } catch (error) {
    throw error;
  }
}

/**
 * Aktualisiert eine existierende Studiengruppe mit neuen Werten
 *
 * @param id - ID der zu aktualisierenden Studiengruppe
 * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
 *
 * @returns - Gibt die aktualisierte Studiengruppe zurück oder undefined, falls ein Fehler auftritt
 */
export async function updateStudyGroupApi(
  id: number,
  updates: Partial<Omit<StudyGroupApiData, "id">>
): Promise<StudyGroupApiData> {
  try {
    const response = await fetch(`${API_BASE_URL}/study-group/${id}`, {
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

    const studyGroup: StudyGroupApiData = await response.json();
    return studyGroup;
  } catch (error) {
    throw error;
  }
}

/**
 * Löscht eine Studiengruppe aus der Datenbank
 *
 * @param id - ID der zu löschenden Studiengruppe
 */
export async function deleteStudyGroupApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/study-group/${id}`, {
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
