import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createLecturerApi,
  getLecturerApi,
  listLecturersApi,
  updateLecturerApi,
} from "@/api/lecturer";
import type { LecturerApiData } from "@/api/types";
import { LecturerKind } from "@/enums/enums";

vi.mock("@/composables/useNotification", () => ({
  useNotification: () => ({
    handleApiErrors: vi.fn(async (response: Response) => {
      throw new Error("API Fehler");
    }),
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(body: any, ok = true, status = 200) {
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

describe("getLecturerApi", () => {
  const fakeLecturer: LecturerApiData = {
    id: 1,
    first_name: "Test",
    last_name: "Lehrer",
    abbreviation: "TL",
    kind: LecturerKind.LAB_ENGINEER,
    notes: "",
    is_relevant: true,
    extra_data: { Büro: "A101", Telefon: "0123456" },
  };

  it("ruft Fetch korrekt auf und gibt den Dozenten zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeLecturer));

    const result = await getLecturerApi(1);

    expect(result).toEqual(fakeLecturer);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/lecturer/1"),
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(getLecturerApi(1)).rejects.toThrow();
  });
});

describe("createLecturerApi", () => {
  const fakeLecturer: LecturerApiData = {
    id: 1,
    first_name: "Test",
    last_name: "Lehrer",
    abbreviation: "TL",
    kind: LecturerKind.LAB_ENGINEER,
    notes: "",
    is_relevant: true,
    extra_data: { Büro: "A101", Telefon: "0123456" },
  };

  it("ruft Fetch korrekt auf und gibt den erstellten Dozenten zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeLecturer));

    const result = await createLecturerApi(
      "Test",
      "Lehrer",
      LecturerKind.LAB_ENGINEER,
      "TL",
      "Einige Notizen",
      true
    );

    expect(result).toEqual(fakeLecturer);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/lecturer"),
      expect.objectContaining({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: "Test",
          last_name: "Lehrer",
          abbreviation: "TL",
          kind: LecturerKind.LAB_ENGINEER,
          notes: "Einige Notizen",
          is_relevant: true,
        }),
      })
    );
  });

  it("funktioniert auch ohne optionale Parameter", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeLecturer));

    await createLecturerApi("Test", "Lehrer", LecturerKind.LAB_ENGINEER, "TL");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/lecturer"),
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(
      createLecturerApi("Test", "Lehrer", LecturerKind.LAB_ENGINEER, "TL")
    ).rejects.toThrow();
  });
});

describe("listLecturersApi", () => {
  const fakeLecturers: LecturerApiData[] = [
    {
      id: 1,
      first_name: "Test",
      last_name: "Lehrer",
      abbreviation: "TL",
      kind: LecturerKind.LAB_ENGINEER,
      notes: "",
      is_relevant: true,
      extra_data: { Büro: "A101", Telefon: "0123456" },
    },
    {
      id: 2,
      first_name: "Test",
      last_name: "Lehrer",
      abbreviation: "TL2",
      kind: LecturerKind.LAB_ENGINEER,
      notes: "",
      is_relevant: true,
      extra_data: { Büro: "B101", Telefon: "00000" },
    },
  ];

  it("ruft Fetch korrekt auf und gibt alle Dozenten zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeLecturers));

    const result = await listLecturersApi();

    expect(result).toEqual(fakeLecturers);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/lecturer"),
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(listLecturersApi()).rejects.toThrow();
  });
});

describe("updateLecturerApi", () => {
  const updatedFakeLecturer: LecturerApiData = {
    id: 1,
    first_name: "Test",
    last_name: "Lehrer",
    abbreviation: "TL",
    kind: LecturerKind.LAB_ENGINEER,
    notes: "Aktualisiert",
    is_relevant: false,
    extra_data: { Büro: "U101", Telefon: "0123456" },
  };
  const updates = { notes: "Aktualisiert", is_relevant: false };

  it("ruft Fetch korrekt auf und gibt den aktualisierten Dozenten zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(updatedFakeLecturer));

    const result = await updateLecturerApi(1, updates);

    expect(result).toEqual(updatedFakeLecturer);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/lecturer/1"),
      expect.objectContaining({
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(updateLecturerApi(1, updates)).rejects.toThrow();
  });
});
