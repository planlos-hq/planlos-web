import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createCourseColorApi,
  deleteCourseColorApi,
  getCourseColorApi,
  listCourseColorsApi,
  updateCourseColorApi,
} from "@/api/courseColor";
import type { Color } from "@/models/Color";

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

describe("getCourseColorApi", () => {
  const fakeColor: Color = { id: 1, name: "Rot", hex: "#FF0000" };

  it("ruft Fetch korrekt auf und gibt die Farbe zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeColor));

    const result = await getCourseColorApi(1);

    expect(result).toEqual(fakeColor);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/course-color/1"),
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(getCourseColorApi(1)).rejects.toThrow();
  });
});

describe("createCourseColorApi", () => {
  const fakeColor: Color = { id: 1, name: "Rot", hex: "#FF0000" };

  it("ruft Fetch korrekt auf und gibt die erstellte Farbe zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeColor));

    const result = await createCourseColorApi("Rot", "#FF0000");

    expect(result).toEqual(fakeColor);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/course-color"),
      expect.objectContaining({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Rot", hex: "#FF0000" }),
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(createCourseColorApi("Rot", "#FF0000")).rejects.toThrow();
  });
});

describe("listCourseColorsApi", () => {
  const fakeColors: Color[] = [
    { id: 1, name: "Rot", hex: "#FF0000" },
    { id: 2, name: "Blau", hex: "#0000FF" },
  ];

  it("ruft Fetch korrekt auf und gibt alle Farben zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeColors));

    const result = await listCourseColorsApi();

    expect(result).toEqual(fakeColors);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/course-color"),
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(listCourseColorsApi()).rejects.toThrow();
  });
});

describe("updateCourseColorApi", () => {
  const updatedFakeColor: Color = { id: 1, name: "Dunkelrot", hex: "#8B0000" };
  const updates = { name: "Dunkelrot", hex: "#8B0000" };

  it("ruft Fetch korrekt auf und gibt die aktualisierte Farbe zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(updatedFakeColor));

    const result = await updateCourseColorApi(1, updates);

    expect(result).toEqual(updatedFakeColor);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/course-color/1"),
      expect.objectContaining({
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(updateCourseColorApi(1, updates)).rejects.toThrow();
  });
});

describe("deleteCourseColorApi", () => {
  it("ruft Fetch mit DELETE und URL auf und löscht die Farbe", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));

    await expect(deleteCourseColorApi(1)).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/course-color/1"),
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it.each(errorCases.filter(c => c.name !== "das JSON inkorrekt ist"))(
    "wirft einen Fehler wenn $name",
    async ({ setup }) => {
      setup();
      await expect(deleteCourseColorApi(1)).rejects.toThrow();
    }
  );
});
