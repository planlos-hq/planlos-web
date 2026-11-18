import { useNotification } from "@/composables/useNotification";
import type { LecturerTimeConstraint } from "@/models/LecturerTimeConstraint";
import type { LecturerTimeConstraintApiData } from "./types";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Wandelt eine PostgreSQL-Zeit bzw. -Dauer ("08:00:00", "1 day 02:00:00") in Minuten um.
 *
 * @param value - Zeit oder Dauer als Text
 * @returns Minuten
 */
function toMinutes(value: string): number {
  const days = Number(/(\d+) days?/.exec(value)?.[1] ?? 0);
  const [, hours = "0", minutes = "0"] = /(\d+):(\d+)/.exec(value) ?? [];
  return days * 24 * 60 + Number(hours) * 60 + Number(minutes);
}

/**
 * Wandelt Minuten in "HH:MM" um.
 *
 * @param minutes - Minuten
 * @returns Zeit bzw. Dauer als "HH:MM"
 */
function fromMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${(minutes % 60).toString().padStart(2, "0")}`;
}

function mapApiConstraint(c: LecturerTimeConstraintApiData): LecturerTimeConstraint {
  const from = toMinutes(c.at);
  return {
    id: c.id,
    lecturer: c.lecturer,
    weekday: c.weekday,
    from,
    to: from + toMinutes(c.duration),
    soft: c.soft,
  };
}

/**
 * Lädt alle Zeiten, in denen eine Lehrperson nicht verfügbar ist.
 *
 * @param lecturerId - ID der Lehrperson
 * @returns Array der Einschränkungen
 */
export async function listLecturerTimeConstraintsApi(
  lecturerId: number
): Promise<LecturerTimeConstraint[]> {
  const response = await fetch(`${API_BASE_URL}/lecturer/${lecturerId}/negative-time-constraint`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
  }

  const constraints: LecturerTimeConstraintApiData[] = await response.json();
  return constraints.map(mapApiConstraint);
}

/**
 * Lädt die nicht verfügbaren Zeiten aller Lehrpersonen.
 *
 * @returns Array der Einschränkungen
 */
export async function listAllLecturerTimeConstraintsApi(): Promise<LecturerTimeConstraint[]> {
  const response = await fetch(`${API_BASE_URL}/lecturer/negative-time-constraint`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
  }

  const constraints: LecturerTimeConstraintApiData[] = await response.json();
  return constraints.map(mapApiConstraint);
}

/**
 * Legt eine Zeit an, in der eine Lehrperson nicht verfügbar ist.
 *
 * @param constraint - Einschränkung ohne ID
 */
export async function createLecturerTimeConstraintApi(
  constraint: Omit<LecturerTimeConstraint, "id">
) {
  const response = await fetch(`${API_BASE_URL}/lecturer-negative-time-constraint`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lecturer: constraint.lecturer,
      weekday: constraint.weekday,
      at: fromMinutes(constraint.from),
      duration: fromMinutes(constraint.to - constraint.from),
      soft: constraint.soft,
    }),
  });

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
  }
}

/**
 * Löscht eine Einschränkung.
 *
 * @param id - ID der Einschränkung
 */
export async function deleteLecturerTimeConstraintApi(id: number) {
  const response = await fetch(`${API_BASE_URL}/lecturer-negative-time-constraint/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const { handleApiErrors } = useNotification();
    await handleApiErrors(response);
  }
}
