import { useNotification } from "@/composables/useNotification";
import type { IgnoredResourceConflictApiData, ResourceConflictApiData } from "./types";
import type { ResourceType } from "@/models/ResourceConflict";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Lädt alle Constraint-Verletzungen aus der Datenbank.
 *
 * @returns alle Ressourcen-Konflikte
 */
export async function getAllResourceConflictsApi() {
  const response = await fetch(`${API_BASE_URL}/resource-constraint-violations`, {
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

  const resourceConflicts: ResourceConflictApiData[] = await response.json();
  return resourceConflicts;
}

/**
 * Lädt alle Stundenplanungskonflikte für eine spezifische Ressource aus der Datenbank.
 *
 * @param resourceType - Art der Ressource
 * @param id - Die eindeutige ID der Ressource
 *
 * @returns Stundenplanungskonflikte einer spezifischen Ressource
 */
export async function getConflictsForResourceApi(resourceType: ResourceType, id: number) {
  const type = resourceType === "study_group" ? "study-group" : resourceType;
  const response = await fetch(`${API_BASE_URL}/${type}/${id}/constraint-violations`, {
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

  const resourceConflicts: ResourceConflictApiData[] = await response.json();
  return resourceConflicts;
}

/**
 * Lädt alle Stundenplanungskonflikte für einen spezifischen Raum aus der Datenbank.
 *
 * @param id - Die eindeutige ID eines Raums
 *
 * @returns Stundenplanungskonflikte eines spezifischen Raums
 */
export async function getRoomConflictsApi(id: number) {
  return getConflictsForResourceApi("room", id);
}

/**
 * Lädt alle Stundenplanungskonflikte für einen spezifischen Dozenten aus der Datenbank.
 *
 * @param id - Die eindeutige ID eines Dozenten
 *
 * @returns Stundenplanungskonflikte eines spezifischen Dozenten
 */
export async function getLecturerConflictsApi(id: number) {
  return getConflictsForResourceApi("lecturer", id);
}

/**
 * Lädt alle Stundenplanungskonflikte für eine spezifische Studiengruppe aus der Datenbank.
 *
 * @param id - Die eindeutige ID einer Studiengruppe
 *
 * @returns Stundenplanungskonflikte einer spezifischen Studiengruppe
 */
export async function getStudyGroupConflictsApi(id: number) {
  return getConflictsForResourceApi("study_group", id);
}

/**
 * Lädt alle Konflikte, die für eine bestimmte Studiengruppe relevant sind.
 * Dazu gehören auch z.B. Raum- oder Dozentenkonflikte, die die Studiengruppe betreffen.
 *
 * @param id - Die eindeutige ID einer Studiengruppe
 *
 * @returns alle Ressourcenkonflikte relevant für die spezifizierte Studiengruppe
 */

/*
Dieser Endpunkt gibt auch "lecturer_time_constraint_violations" zurück, die bis jetzt noch nicht genutzt werden

export async function getAllStudyGroupRelatedConflictsApi(id: number) {
  const response = await fetch(`${API_BASE_URL}/study-group/${id}/related-constraint-violations`, {
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

  const resourceConflicts: ResourceConflictApiData[] = await response.json();
  return resourceConflicts;
}
  */

/**
 * Speichert eine Constraint-Verletzung als "ignoriert".
 *
 * @param slotA - ID des ersten betroffenen Zeitslots
 * @param slotB - ID des zweiten betroffenen Zeitslots
 * @param resourceType - Typ der Ressource: "room" | "study-group" | "lecturer"
 * @param resourceId - ID der betroffenen Ressource
 */
export async function ignoreResourceConflictApi(
  slotA: number,
  slotB: number,
  resourceType: ResourceType,
  resourceId: number
) {
  const response = await fetch(`${API_BASE_URL}/resource-constraint-violations/ignore`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slot_a_id: slotA,
      slot_b_id: slotB,
      resource_type: resourceType,
      resource_id: resourceId,
    }),
  });

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
    return;
  }
}

/**
 * Hebt den "ignoriert"-Status einer Constraint-Verletzung wieder auf.
 *
 * @param ignoredConflict - der ignorierte Ressourcenkonflikt
 */
export async function unignoreResourceConflictApi(ignoredConflict: IgnoredResourceConflictApiData) {
  const response = await fetch(`${API_BASE_URL}/resource-constraint-violations/ignore`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slot_a_id: ignoredConflict.slot_a,
      slot_b_id: ignoredConflict.slot_b,
      resource_type: ignoredConflict.resource_type,
      resource_id: ignoredConflict.resource_id,
    }),
  });

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
    return;
  }
}

/**
 * Lädt alle ignorierten Constraint-Verletzungen aus der Datenbank.
 *
 * @returns alle Ressourcen-Konflikte
 */
export async function getIgnoredResourceConflictsApi() {
  const response = await fetch(`${API_BASE_URL}/resource-constraint-violations/ignored`, {
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

  const resourceConflicts: IgnoredResourceConflictApiData[] = await response.json();
  return resourceConflicts;
}
