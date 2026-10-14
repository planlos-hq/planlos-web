import { useNotification } from "@/composables/useNotification";
import type { CourseApiData, LecturerApiData, StudyGroupApiData } from "./types";
import type { Color } from "@/models/Color";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Speichert eine Veranstaltung persistent in der Datenbank.
 *
 * @param number - Veranstaltungsnummer
 * @param name - Name der Veranstaltung
 * @param abbreviation - Kürzel der Veranstaltung
 * @param sws - Semesterwochenstunden
 * @param creditPoints - Credit-Punkte der Veranstaltung
 * @returns - Gibt die neu erstellte Veranstaltung oder undefined zurück
 */
export async function createCourseApi(
  number: string,
  name: string,
  abbreviation: string,
  sws?: number,
  creditPoints?: number,
  extraData?: Record<string, string>
) {
  try {
    const response = await fetch(`${API_BASE_URL}/course`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: number,
        name: name,
        sws: sws,
        credit_points: creditPoints,
        abbreviation: abbreviation,
        extra_data: extraData,
      }),
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const courseData: CourseApiData = await response.json();
    return courseData;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt eine Veranstaltung anhand ihrer ID aus der Datenbank.
 *
 * @param id - Die eindeutige ID der Veranstaltung
 * @returns Die gefundene Veranstaltung oder undefined, falls nicht vorhanden
 */
export async function getCourseApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const courseData: CourseApiData = await response.json();
    return courseData;
  } catch (error) {
    throw error;
  }
}

/**
 * Lädt alle Veranstaltungen aus der Datenbank.
 *
 * @returns - Gibt ein Array aller Veranstaltungen zurück
 */
export async function listCoursesApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/course`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const { handleApiErrors } = useNotification();
      await handleApiErrors(response);
    }

    const courses: CourseApiData[] = await response.json();
    return courses;
  } catch (error) {
    throw error;
  }
}

/**
 * Aktualisiert eine existierende Veranstaltung mit neuen Werten
 *
 * @param id - ID der zu aktualisierenden Veranstaltung
 * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
 *
 * @returns - Gibt die aktualisierte Veranstaltung zurück oder undefined, falls ein Fehler auftritt
 */
export async function updateCourseApi(id: number, updates: Partial<Omit<CourseApiData, "id">>) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${id}`, {
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

    const courseData: CourseApiData = await response.json();
    return courseData;
  } catch (error) {
    throw error;
  }
}

/**
 * Löscht eine Veranstaltung aus der Datenbank
 *
 * @param id - ID der zu löschenden Veranstaltung
 */
export async function deleteCourseApi(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${id}`, {
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

// "CourseLecturer"-Endpunkte:

/**
 * Speichert die Zuweisung eines Dozenten zu einer Veranstaltung.
 *
 * @param courseId - ID der Veranstaltung
 * @param lecturerId - ID des Dozenten
 */
export async function assignLecturerToCourseApi(courseId: number, lecturerId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/lecturer/${lecturerId}`, {
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
 * Lädt alle Dozenten einer Veranstaltung aus der Datenbank.
 *
 * @param courseId - ID der Veranstaltung
 * @returns Array aller Dozenten einer Veranstaltung.
 */
export async function getCourseLecturersApi(courseId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/lecturers`, {
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

/**
 * Die Zuweisung eines Dozenten zu einer Veranstaltung aufheben.
 *
 * @param courseId - ID der Veranstaltung
 * @param lecturerId - ID des Dozenten
 */
export async function removeLecturerFromCourseApi(courseId: number, lecturerId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/lecturer/${lecturerId}`, {
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

// "CourseStudygroup"-Endpunkte:

/**
 * Speichert die Zuweisung einer Studiengruppe zu einer Veranstaltung.
 *
 * @param courseId - ID der Veranstaltung
 * @param studyGroupId - ID der Studiengruppe
 */
export async function assignStudyGroupToCourseApi(courseId: number, studyGroupId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/study-group/${studyGroupId}`, {
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
 * Lädt alle Studiengruppen einer Veranstaltung aus der Datenbank.
 *
 * @param courseId - ID der Veranstaltung
 * @returns Array aller Studiengruppen einer Veranstaltung.
 */
export async function getCourseStudyGroupsApi(courseId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/study-groups`, {
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
 * Die Zuweisung einer Studiengruppe zu einer Veranstaltung aufheben.
 *
 * @param courseId - ID der Veranstaltung
 * @param studyGroupId - ID der Studiengruppe
 */
export async function removeStudyGroupFromCourseApi(courseId: number, studyGroupId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/study-group/${studyGroupId}`, {
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

/**
 * Erhalte alle Farben, die einem Kurs zugeordnet sind
 *
 * @param courseId - ID des Kurse
 * @returns Liste an zugeordneten Farben
 */

export async function getCourseColorsApi(courseId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/colors`, {
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
 * Zuweisung einer Farbe zu einem Kurs
 *
 * @param courseId - ID des Kurse
 * @param colorId - ID der Farbe
 */
export async function assignColorToCourseApi(courseId: number, colorId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/color/${colorId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id: courseId,
        color_id: colorId,
      }),
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
 * Hebt eine Zuweisung einer Farbe zu einem Kurs auf
 *
 * @param courseId - ID des Kurse
 * @param colorId - ID der Farbe
 */
export async function removeColorFromCourseApi(courseId: number, colorId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/color/${colorId}`, {
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
