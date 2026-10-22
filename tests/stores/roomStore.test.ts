import { describe, expect, it, vi, beforeEach } from "vitest";
import { createApp } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { useRoomStore } from "@/stores/roomStore";
import { handleRoom } from "@/updates/room.updates";
import type { Room } from "@/models/Room";

const mockShowSuccess = vi.fn();
const mockHandleError = vi.fn();
const mockShowError = vi.fn();

vi.mock("@/composables/useNotification", () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    handleError: mockHandleError,
    showError: mockShowError,
  }),
}));

const mockCreateRoomApi = vi.fn();
const mockUpdateRoomApi = vi.fn();
const mockDeleteRoomApi = vi.fn();
const mockListRoomsApi = vi.fn();

vi.mock("@/api/room", () => ({
  createRoomApi: (number: string, name?: string, seats?: number) =>
    mockCreateRoomApi(number, name, seats),
  updateRoomApi: (id: number, updates: Partial<Omit<Room, "id">>) => mockUpdateRoomApi(id, updates),
  deleteRoomApi: (id: number) => mockDeleteRoomApi(id),
  listRoomsApi: () => mockListRoomsApi(),
}));

let router: Router;

// roomStore liest die Auswahl über den viewStore aus der URL und braucht dafür einen Router
beforeEach(async () => {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { render: () => null } }],
  });
  const pinia = createPinia();
  createApp({}).use(pinia).use(router);
  setActivePinia(pinia);
  await router.push("/");
  vi.clearAllMocks();
});

describe("createRoom", () => {
  const fakeRoom: Room = { id: 1, number: "5.001", name: "fakeRoom", seats: 12 };
  const newRoom = { number: "5.001", name: "fakeRoom", seats: 12 };

  // Der Store ändert die Liste nicht selbst: neue Räume kommen über das Live-Update (SSE) herein,
  // damit alle geöffneten Tabs denselben Stand haben.
  it("bei Erfolg wird der Raum angelegt und kommt per Live-Update in roomList", async () => {
    mockCreateRoomApi.mockResolvedValue(fakeRoom);
    const store = useRoomStore();

    await store.createRoom(newRoom);

    expect(mockCreateRoomApi).toHaveBeenCalledWith("5.001", "fakeRoom", 12);
    expect(store.roomList).toHaveLength(0);

    handleRoom("create", { id: 1, number: "5.001", name: "fakeRoom", seats: 12, extra_data: {} });
    expect(store.roomList).toEqual([{ ...fakeRoom, extraData: {} }]);
  });

  it("bei Erfolg wird showSuccess aufgerufen", async () => {
    mockCreateRoomApi.mockResolvedValue(fakeRoom);
    const store = useRoomStore();

    await store.createRoom(newRoom);

    expect(mockShowSuccess).toHaveBeenCalledOnce();
  });

  it("bei Fehler ist roomList nicht verändert", async () => {
    mockCreateRoomApi.mockRejectedValue(new Error("API Fehler"));
    const store = useRoomStore();

    await store.createRoom(newRoom);

    expect(store.roomList).toHaveLength(0);
    expect(mockHandleError).toHaveBeenCalledOnce();
  });

  it("bei Fehler wird handleError aufgerufen", async () => {
    mockCreateRoomApi.mockRejectedValue(new Error("API Fehler"));
    const store = useRoomStore();

    await store.createRoom(newRoom);

    expect(mockHandleError).toHaveBeenCalledOnce();
  });
});

describe("readRoom", () => {
  const fakeRoom: Room = { id: 1, number: "5.001", name: "fakeRoom", seats: 12 };

  it("gibt Raum zurück, wenn in Liste vorhanden", () => {
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    const result = store.readRoom(1);

    expect(result).toEqual(fakeRoom);
  });

  it("wenn Raum nicht in Liste, dann undefined", () => {
    const store = useRoomStore();

    const result = store.readRoom(5);

    expect(result).toBeUndefined();
  });

  it("ruft showError auf, wenn Raum nicht gefunden", () => {
    const store = useRoomStore();

    store.readRoom(5);

    expect(mockShowError).toHaveBeenCalledOnce();
  });
});

describe("updateRoom", () => {
  const fakeRoom: Room = { id: 1, number: "5.001", name: "fakeRoom", seats: 12 };
  const updates = { number: "5.101", name: "updatedFakeRoom" };
  const updatedRoom: Room = { id: 1, number: "5.101", name: "updatedFakeRoom", seats: 12 };

  it("bei Erfolg wird der Raum aktualisiert und per Live-Update in roomList übernommen", async () => {
    mockUpdateRoomApi.mockResolvedValue(updatedRoom);
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, { ...fakeRoom });

    await store.updateRoom(1, updates);

    expect(mockUpdateRoomApi).toHaveBeenCalledWith(1, { number: "5.101", name: "updatedFakeRoom" });
    expect(store.roomList[0]).toEqual(fakeRoom);

    handleRoom("update", {
      id: 1,
      number: "5.101",
      name: "updatedFakeRoom",
      seats: 12,
      extra_data: {},
    });
    expect(store.roomList[0]).toEqual({ ...updatedRoom, extraData: {} });
  });

  it("bei Erfolg wird showSuccess aufgerufen", async () => {
    mockUpdateRoomApi.mockResolvedValue(updatedRoom);
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    await store.updateRoom(1, updates);

    expect(mockShowSuccess).toHaveBeenCalledOnce();
  });

  it("bei API-Fehler bleibt roomList unverändert", async () => {
    mockUpdateRoomApi.mockRejectedValue(new Error("API-Fehler"));
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    await store.updateRoom(1, updates);

    expect(store.roomList[0]).toEqual(fakeRoom);
  });

  it("bei Fehler wird handleError aufgerufen", async () => {
    mockUpdateRoomApi.mockRejectedValue(new Error("API-Fehler"));
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    await store.updateRoom(1, updates);

    expect(mockHandleError).toHaveBeenCalledOnce();
  });

  it("ruft handleError auf, wenn Raum nicht in roomList ist", async () => {
    mockUpdateRoomApi.mockResolvedValue(updatedRoom);
    const store = useRoomStore();

    await store.updateRoom(1, updates);

    expect(mockHandleError).toHaveBeenCalledOnce();
    expect(mockUpdateRoomApi).not.toHaveBeenCalled();
  });
});

describe("deleteRoom", () => {
  const fakeRoom: Room = { id: 1, number: "5.001", name: "fakeRoom", seats: 12 };

  it("bei Erfolg wird der Raum gelöscht und per Live-Update aus roomList entfernt", async () => {
    mockDeleteRoomApi.mockResolvedValue(undefined);
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    await store.deleteRoom(1);

    expect(mockDeleteRoomApi).toHaveBeenCalledWith(1);
    expect(store.roomList).toHaveLength(1);

    handleRoom("delete", 1);
    expect(store.roomList).toHaveLength(0);
  });

  it("bei Erfolg wird showSuccess aufgerufen", async () => {
    mockDeleteRoomApi.mockResolvedValue(undefined);
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    await store.deleteRoom(1);

    expect(mockShowSuccess).toHaveBeenCalledOnce();
  });

  it("bei API-Fehler ist roomList unverändert", async () => {
    mockDeleteRoomApi.mockRejectedValue(new Error("API-Fehler"));
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    await store.deleteRoom(1);

    expect(store.roomList).toHaveLength(1);
  });

  it("bei API-Fehler wird handleError aufgerufen", async () => {
    mockDeleteRoomApi.mockRejectedValue(new Error("API-Fehler"));
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    await store.deleteRoom(1);

    expect(mockHandleError).toHaveBeenCalledOnce();
  });

  it("wenn Raum nicht in roomList, wird showSuccess nicht angezeigt", async () => {
    mockDeleteRoomApi.mockResolvedValue(undefined);
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    await store.deleteRoom(5);

    expect(store.roomList).toHaveLength(1);
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });
});

describe("selectedRoom (computed)", () => {
  const fakeRoom: Room = { id: 1, number: "5.001", name: "fakeRoom", seats: 12 };

  it("wenn ein Raum in der URL ausgewählt ist, dann wird er zurückgegeben", async () => {
    await router.push("/?tab=room&room=1");
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    expect(store.selectedRoom).toEqual(fakeRoom);
  });

  it("wenn die ausgewählte ID nicht existiert, dann undefined", async () => {
    await router.push("/?tab=room&room=5");
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    expect(store.selectedRoom).toBeUndefined();
  });

  it("wenn nichts ausgewählt ist, dann undefined", () => {
    const store = useRoomStore();
    store.roomMap.set(fakeRoom.id, fakeRoom);

    expect(store.selectedRoom).toBeUndefined();
  });
});

describe("setRooms", () => {
  const fakeRooms: Room[] = [
    { id: 1, number: "5.001", name: "fakeRoom1", seats: 12 },
    { id: 2, number: "5.002", name: "fakeRoom2", seats: 24 },
  ];

  it("setzt roomList auf das übergebene Array", () => {
    const store = useRoomStore();

    fakeRooms.forEach(r => {
      store.roomMap.set(r.id, r);
    });

    expect(store.roomList).toEqual(fakeRooms);
  });
});
