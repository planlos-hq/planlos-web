/**
 * Fehler, der geworfen wird, wenn die API mit einem HTTP-Fehlerstatus antwortet.
 * Der Status bleibt erhalten, damit Aufrufer zwischen Fehlerarten unterscheiden können.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
