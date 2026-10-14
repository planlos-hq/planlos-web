import { useNotification } from "@/composables/useNotification";
import type { CourseApiData, StudyGroupTemplateApiData } from "./types";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Erstellt und speichert ein Template für Studiengruppen persistent
 *
 * @param name - Name für das Template
 *
 * @returns - Gibt das neu erstellte Template zurück
 */
export async function createStudyGroupTemplateApi(name: string) {
  const response = await fetch(`${API_BASE_URL}/study-group-template`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: name,
    }),
  });

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
    return;
  }

  const template: StudyGroupTemplateApiData = await response.json();
  return template;
}

/**
 * Lädt das Template für eine Studiengruppe anhand der ID aus der Datenbank
 *
 * @param id - Die eindeutige ID des Template
 *
 * @returns Das gefundene Template oder undefined, falls nicht vorhanden
 */
export async function getStudyGroupTemplateApi(id: number) {
  const response = await fetch(`${API_BASE_URL}/study-group-template/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
    return;
  }

  const template: StudyGroupTemplateApiData = await response.json();
  return template;
}

/**
 * Lädt alle Templates für Studiengruppen aus der Datenbank
 *
 * @returns - Gibt ein Array aller Studiengruppen-Templates zurück
 */
export async function listStudyGroupTemplatesApi() {
  const response = await fetch(`${API_BASE_URL}/study-group-template`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
    return;
  }

  const templates: StudyGroupTemplateApiData[] = await response.json();
  return templates;
}

/**
 * Aktualisiert eine existierendes Studiengruppen-Template
 *
 * @param id - ID des zu aktualisierenden Templates
 * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
 *
 * @returns - Gibt das aktualisierte Template zurück oder undefined, falls ein Fehler auftritt
 */
export async function updateStudyGroupTemplateApi(
  id: number,
  updates: Partial<Omit<StudyGroupTemplateApiData, "id">>
) {
  const response = await fetch(`${API_BASE_URL}/study-group-template/${id}`, {
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
    return;
  }

  const studyGroup: StudyGroupTemplateApiData = await response.json();
  return studyGroup;
}

/**
 * Löscht ein Studiengruppen-Template aus der Datenbank
 *
 * @param id - ID des zu löschenden Studiengruppen-Templates
 */
export async function deleteStudyGroupTemplateApi(id: number) {
  const response = await fetch(`${API_BASE_URL}/study-group-template/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
    return;
  }
}

// "StudyGroupTemplateCourse"-Endpunkte:

/**
 * Speichert die Zuweisung einer Veranstaltung zu einem Studiengruppen-Template.
 *
 * @param templateId - ID des Templates
 * @param courseId - ID der Veranstaltung
 */
export async function assignCourseToStudyGroupTemplateApi(templateId: number, courseId: number) {
  const response = await fetch(
    `${API_BASE_URL}/study-group-template/${templateId}/course/${courseId}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
    return;
  }
}

/**
 * Lädt alle Veranstaltungen eines Studiengruppen-Templates aus der Datenbank.
 *
 * @param templateId - ID des Templates
 * @returns Array aller Veranstaltungen eines Templates oder undefined, falls nicht vorhanden.
 */
export async function getStudyGroupTemplateCoursesApi(templateId: number) {
  const response = await fetch(`${API_BASE_URL}/study-group-template/${templateId}/courses`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
    return;
  }

  const courses: CourseApiData[] = await response.json();
  return courses;
}

/**
 * Hebt die Zuweisung eines Kurses zu einem Template auf.
 *
 * @param templateId - ID des Templates
 * @param courseId - ID der Veranstaltung
 */
export async function removeCourseFromStudyGroupTemplateApi(templateId: number, courseId: number) {
  const response = await fetch(
    `${API_BASE_URL}/study-group-template/${templateId}/course/${courseId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
    return;
  }
}
