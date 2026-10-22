import { ApiError } from "./ApiError";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type BatchFields = Record<string, unknown>;

/** "id": bei update/delete der Eintrag, bei create Wiederherstellen unter dieser ID */
export type BatchOp =
  | { kind: "create"; resource: string; id?: number; data: BatchFields }
  | { kind: "update"; resource: string; id: number; set: BatchFields; expect?: BatchFields }
  | { kind: "delete"; resource: string; id?: number; data?: BatchFields; expect?: BatchFields };

export type BatchRequest = { ops: BatchOp[] };

export type BatchResult = {
  before: BatchFields | null;
  after: BatchFields | null;
  /** Nebenbei gelöschte Einträge, z. B. ignorierte Konflikte */
  cascade?: { resource: string; row: BatchFields }[];
};

export type BatchResponse = { results: BatchResult[] };

/**
 * Führt mehrere Änderungen in einer Transaktion aus
 *
 * @param request - die Operationen
 * @returns Zustand vor/nach jeder Operation
 */
export async function batchApi(request: BatchRequest): Promise<BatchResponse> {
  const response = await fetch(`${API_BASE_URL}/batch`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let message = `Fehler beim Speichern (${response.status})`;
    try {
      const body: { error?: unknown } = await response.json();
      if (typeof body.error === "string") message = body.error;
    } catch {
      // kein JSON im Fehlerfall
    }
    throw new ApiError(response.status, message);
  }

  return await response.json();
}
