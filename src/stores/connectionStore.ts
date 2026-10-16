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
  if (error instanceof ApiError && error.status >= 500)
    return { code: ConnectionErrorCode.ServerError, httpStatus: error.status };
  if (error instanceof SyntaxError) return { code: ConnectionErrorCode.InvalidResponse };
  return null;
}

/**
 * Pinia Store für den Verbindungsstatus zum Server
 *
 * @returns Ein Objekt mit:
 * - connectionError: Der aktuelle Verbindungsfehler oder null
 * - hasConnectionError: Ob ein Verbindungsfehler vorliegt
 * - reportConnectionError: Funktion zum Melden eines Fehlers
 */
export const useConnectionStore = defineStore("connection", () => {
  const connectionError = ref<ConnectionError | null>(null);
  const hasConnectionError = computed(() => connectionError.value !== null);

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

  return { connectionError, hasConnectionError, reportConnectionError };
});
