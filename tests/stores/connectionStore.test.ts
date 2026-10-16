import { describe, expect, it, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useConnectionStore } from "@/stores/connectionStore";
import { ApiError } from "@/api/ApiError";
import { ConnectionErrorCode } from "@/enums/enums";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("reportConnectionError", () => {
  it("bei Netzwerkfehler wird ServerUnreachable gesetzt", () => {
    const store = useConnectionStore();

    const result = store.reportConnectionError(new TypeError("Failed to fetch"));

    expect(result).toBe(true);
    expect(store.hasConnectionError).toBe(true);
    expect(store.connectionError).toEqual({ code: ConnectionErrorCode.ServerUnreachable });
  });

  it("bei 5xx-Status wird ServerError mit HTTP-Status gesetzt", () => {
    const store = useConnectionStore();

    store.reportConnectionError(new ApiError(503, "Service Unavailable"));

    expect(store.connectionError).toEqual({
      code: ConnectionErrorCode.ServerError,
      httpStatus: 503,
    });
  });

  it("bei ungültigem JSON wird InvalidResponse gesetzt", () => {
    const store = useConnectionStore();

    store.reportConnectionError(new SyntaxError("Unexpected token <"));

    expect(store.connectionError).toEqual({ code: ConnectionErrorCode.InvalidResponse });
  });

  it.each([new ApiError(404, "Not Found"), new Error("Mapping fehlgeschlagen")])(
    "bei anderen Fehlern wird kein Verbindungsfehler gesetzt (%s)",
    error => {
      const store = useConnectionStore();

      const result = store.reportConnectionError(error);

      expect(result).toBe(false);
      expect(store.hasConnectionError).toBe(false);
    }
  );
});
