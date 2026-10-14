import { describe, expect, it, vi, beforeEach } from "vitest";
import { createRoomApi, deleteRoomApi, getRoomApi, listRoomsApi, updateRoomApi } from "@/api/room";
import type { Room } from "@/models/Room";

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

describe("getRoomApi", () => {
  const fakeRoom: Room = { id: 1, number: "5.001", name: "fakeRoom", seats: 12 };

  it("ruft Fetch korrekt auf und gibt den Raum zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeRoom));

    const result = await getRoomApi(1);

    expect(result).toEqual(fakeRoom);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/room/1"),
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(getRoomApi(1)).rejects.toThrow();
  });
});

describe("createRoomApi", () => {
  const fakeRoom: Room = { id: 1, number: "5.001", name: "fakeRoom", seats: 12 };

  it("ruft Fetch korrekt auf und gibt den erstellten Raum zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeRoom));

    const result = await createRoomApi("5.001", "fakeRoom", 12);

    expect(result).toEqual(fakeRoom);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/room"),
      expect.objectContaining({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ number: "5.001", name: "fakeRoom", seats: 12 }),
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(createRoomApi("5.001", "fakeRoom", 12)).rejects.toThrow();
  });
});

describe("listRoomsApi", () => {
  const fakeRooms: Room[] = [
    { id: 1, number: "5.001", name: "fakeRoom", seats: 12 },
    { id: 2, number: "5.002", name: "fakeRoom", seats: 12 },
  ];

  it("ruft Fetch korrekt auf und gibt alle Räume zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(fakeRooms));

    const result = await listRoomsApi();

    expect(result).toEqual(fakeRooms);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/room"),
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(listRoomsApi()).rejects.toThrow();
  });
});

describe("updateRoomApi", () => {
  const updatedFakeRoom: Room = { id: 1, number: "5.101", name: "updatedFakeRoom", seats: 12 };
  const updates = { number: "5.101", name: "updatedFakeRoom" };

  it("ruft Fetch korrekt auf und gibt den aktualisierten Raum zurück", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(updatedFakeRoom));

    const result = await updateRoomApi(1, updates);

    expect(result).toEqual(updatedFakeRoom);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/room/1"),
      expect.objectContaining({
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
    );
  });

  it.each(errorCases)("wirft einen Fehler wenn $name", async ({ setup }) => {
    setup();
    await expect(updateRoomApi(1, updates)).rejects.toThrow();
  });
});

describe("deleteRoomApi", () => {
  it("ruft Fetch mit DELETE und URL auf und löscht den Raum", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));

    await expect(deleteRoomApi(1)).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/room/1"),
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
      await expect(deleteRoomApi(1)).rejects.toThrow();
    }
  );
});
