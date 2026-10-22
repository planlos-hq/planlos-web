import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createDegreeProgramApi,
  deleteDegreeProgramApi,
  getDegreeProgramApi,
  listDegreeProgramsApi,
  updateDegreeProgramApi,
} from "@/api/degreeProgram";
import type { DegreeProgram } from "@/models/DegreeProgram";

vi.mock("@/composables/useNotification", () => ({
  useNotification: () => ({
    handleApiErrors: vi.fn(async () => {
      throw new Error("API Fehler");
    }),
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  };
}

const errorCases = [
  {
    name: "fetch fehlschlägt",
    setup: () => mockFetch.mockRejectedValueOnce(new TypeError("Network request failed")),
  },
  {
    name: "ok false ist",
    setup: () => mockFetch.mockResolvedValueOnce(mockResponse(null, false, 404)),
  },
  {
    name: "das JSON inkorrekt ist",
    setup: () =>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError()),
      }),
  },
];

beforeEach(() => {
  mockFetch.mockReset();
});

describe("getDegreeProgramApi", () => {
  const fakeDegreeProgram: DegreeProgram = {
    id: 1,
    name: "Informatik",
    abbreviation: "INF",
  };

  it("ruft Fetch korrekt auf und gibt den Studiengang zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeDegreeProgram));

    const result = await getDegreeProgramApi(1);

    expect(result).toEqual(fakeDegreeProgram);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/degree-program/1"),
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(getDegreeProgramApi(1)).rejects.toThrow();
  });
});

describe("createDegreeProgramApi", () => {
  const fakeDegreeProgram: DegreeProgram = {
    id: 1,
    name: "Informatik",
    abbreviation: "INF",
  };

  it("ruft Fetch korrekt auf und gibt den erstellten Studiengang zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeDegreeProgram));

    const result = await createDegreeProgramApi("Informatik", "INF");

    expect(result).toEqual(fakeDegreeProgram);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/degree-program"),
      expect.objectContaining({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Informatik", abbreviation: "INF" }),
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(createDegreeProgramApi("Informatik", "INF")).rejects.toThrow();
  });
});

describe("listDegreeProgramsApi", () => {
  const fakeDegreePrograms: DegreeProgram[] = [
    { id: 1, name: "Informatik", abbreviation: "INF" },
    { id: 2, name: "Wirtschaftsinformatik", abbreviation: "WINF" },
  ];

  it("ruft Fetch korrekt auf und gibt alle Studiengänge zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeDegreePrograms));

    const result = await listDegreeProgramsApi();

    expect(result).toEqual(fakeDegreePrograms);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/degree-program"),
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(listDegreeProgramsApi()).rejects.toThrow();
  });
});

describe("updateDegreeProgramApi", () => {
  const updatedFakeDegreeProgram: DegreeProgram = {
    id: 1,
    name: "Angewandte Informatik",
    abbreviation: "AINF",
  };
  const updates = { name: "Angewandte Informatik", abbreviation: "AINF" };

  it("ruft Fetch korrekt auf und gibt den aktualisierten Studiengang zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(updatedFakeDegreeProgram));

    const result = await updateDegreeProgramApi(1, updates);

    expect(result).toEqual(updatedFakeDegreeProgram);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/degree-program/1"),
      expect.objectContaining({
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(updateDegreeProgramApi(1, updates)).rejects.toThrow();
  });
});

describe("deleteDegreeProgramApi", () => {
  it("ruft Fetch mit DELETE und URL auf und löscht den Studiengang", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));

    await expect(deleteDegreeProgramApi(1)).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/degree-program/1"),
      expect.objectContaining({
        method: "DELETE",
        headers: { Accept: "application/json" },
      })
    );
  });

  it.each(errorCases.filter(c => c.name !== "das JSON inkorrekt ist"))(
    "wirft einen Fehler wenn $name",
    async ({ setup }) => {
      setup();
      await expect(deleteDegreeProgramApi(1)).rejects.toThrow();
    }
  );
});
