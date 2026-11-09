import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { ApiError } from "@/api/ApiError";
import { ConnectionErrorCode } from "@/enums/enums";

export type ConnectionError = {
  code: ConnectionErrorCode;
  httpStatus?: number;
};

/**
 * Ordnet einen Fehler einem Verbindungsfehler zu.
 *
 * @param error - Der aufgetretene Fehler
 * @returns Der Verbindungsfehler oder null, wenn es sich um keinen Verbindungsfehler handelt
 */
export function classifyConnectionError(error: unknown): ConnectionError | null {
  // fetch wirft einen TypeError, wenn der Server gar nicht erreichbar ist
  if (error instanceof TypeError) return { code: ConnectionErrorCode.ServerUnreachable };
  // Abbruch nach Timeout (AbortSignal.timeout), wenn der Server nicht antwortet
  if (error instanceof DOMException && ["TimeoutError", "AbortError"].includes(error.name))
    return { code: ConnectionErrorCode.ServerUnreachable };
  if (error instanceof ApiError && error.status >= 500)
    return { code: ConnectionErrorCode.ServerError, httpStatus: error.status };
  if (error instanceof SyntaxError) return { code: ConnectionErrorCode.InvalidResponse };
  return null;
}

/**
 * Prüft, ob eine Anfrage während der Arbeit an der Verbindung gescheitert ist:
 * Netzwerkfehler, Timeout oder ein Gateway-Fehler (502/503/504, z. B. Server gestoppt).
 * Ein 500 einer einzelnen Aktion zählt nicht dazu, das ist eher ein Fehler im Server.
 *
 * @param error - Der aufgetretene Fehler
 * @returns true, wenn der Server nicht (mehr) erreichbar ist
 */
export function isConnectionLoss(error: unknown): boolean {
  if (error instanceof ApiError) return [502, 503, 504].includes(error.status);
  const code = classifyConnectionError(error)?.code;
  return code === ConnectionErrorCode.ServerUnreachable;
}

/**
 * Pinia Store für den Verbindungsstatus zum Server
 *
 * @returns Ein Objekt mit:
 * - connectionError: Der aktuelle Verbindungsfehler oder null
 * - hasConnectionError: Ob ein Verbindungsfehler vorliegt
 * - reportConnectionError: Funktion zum Melden eines Fehlers
 * - initialLoadDone: Ob der erste Datenabruf beim Start abgeschlossen ist
 * - accessDenied: Gesetzt, wenn der Server den Zugriff verweigert hat
 * - reportAccessDenied: Funktion zum Melden eines verweigerten Zugriffs
 */
export const useConnectionStore = defineStore("connection", () => {
  const connectionError = ref<ConnectionError | null>(null);
  const hasConnectionError = computed(() => connectionError.value !== null);

  /** Der erste Datenabruf beim Start ist abgeschlossen (erfolgreich oder nicht) */
  const initialLoadDone = ref(false);

  /** Der Server hat den Zugriff verweigert (403); username ist das gemeldete Shibboleth-Konto */
  const accessDenied = ref<{ username: string | null } | null>(null);

  /**
   * Merkt sich, dass der Nutzer nicht für PlanLos freigeschaltet ist.
   *
   * @param username - Konto laut Server, falls bekannt
   */
  function reportAccessDenied(username: string | null) {
    accessDenied.value = { username };
  }

  /**
   * Prüft, ob der Fehler ein Verbindungsfehler ist und merkt ihn sich in diesem Fall.
   *
   * @param error - Der aufgetretene Fehler
   * @returns true, wenn es sich um einen Verbindungsfehler handelt
   */
  function reportConnectionError(error: unknown): boolean {
    const classified = classifyConnectionError(error);
    if (!classified) return false;

    connectionError.value = classified;
    return true;
  }

  return {
    connectionError,
    hasConnectionError,
    reportConnectionError,
    initialLoadDone,
    accessDenied,
    reportAccessDenied,
  };
});
