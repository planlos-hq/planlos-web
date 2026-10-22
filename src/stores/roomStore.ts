import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Room } from "@/models/Room";
import { createRoomApi, deleteRoomApi, updateRoomApi } from "@/api/room";
import { useNotification } from "@/composables/useNotification";
import { mapRoomUpdatesToApi } from "@/api/util";
import { Tab } from "@/enums/enums";
import { useViewStore } from "./viewStore";

/**
 * Pinia Store für die Verwaltung von Räumen
 *
 * @returns Ein Objekt mit:
 * - roomList: Reaktive Liste aller Räume
 * - selectedRoom: Ausgewählte Ressource laut Ansicht (URL)
 * - createRoom: Funktion zum Erstellen eines neuen Raums
 * - readRoom: Funktion zum Abrufen eines Raums per ID
 * - updateRoom: Funktion zum Aktualisieren eines Raums
 * - deleteRoom: Funktion zum Löschen eines Raums
 */
export const useRoomStore = defineStore("rooms", () => {
  const roomMap = ref<Map<number, Room>>(new Map<number, Room>());
  const roomList = computed(() => Array.from(roomMap.value.values()));
  const viewStore = useViewStore();
  const { showSuccess, handleError, showError } = useNotification();

  /**
   * Erstellt einen neune Raum und fügt ihn zur Raumliste hinzu
   * @param data - Benötigt ein Room-Objekt ohne ID
   */
  async function createRoom(data: Omit<Room, "id">) {
    const { number, name, seats, extraData } = data;

    try {
      await createRoomApi(number, name ?? "", seats ? Number(seats) : 0, extraData);
      showSuccess("Raum erfolgreich erstellt!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Erstellen eines Raums.");
    }
  }

  /**
   * Sucht einen Raum anhand seiner ID
   *
   * @param id - eindeutige ID des Raums
   * @returns Den gefundenen Raum oder undefined, falls nicht vorhanden
   */
  function readRoom(id: number): Room | undefined {
    const room = roomMap.value.get(id);
    if (!room) {
      showError("Fehler", "Der Raum konnte nicht gefunden werden.");
    }
    return room;
  }

  /**
   * Aktualisiert einen existierenden Raum mit neuen Werten
   *
   * @param id - eindeutige ID des Raums
   * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
   *
   * @example updateRoom(12345, \{ name: "Neuer Raum", seats: 50 \});
   */
  async function updateRoom(id: number, updates: Partial<Omit<Room, "id">>) {
    try {
      if (!roomMap.value.has(id)) {
        throw new Error("Raum nicht gefunden.");
      }
      const apiUpdates = mapRoomUpdatesToApi(updates);
      await updateRoomApi(id, apiUpdates);
      showSuccess("Raum erfolgreich aktualisiert!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Aktualisieren eines Raums.");
    }
  }

  /**
   * Löscht einen Raum anhand seiner ID
   *
   * @param id - eindeutige ID des Raums
   */
  async function deleteRoom(id: number) {
    try {
      if (!roomMap.value.has(id)) {
        throw new Error("Raum nicht gefunden.");
      }
      await deleteRoomApi(id);
      showSuccess("Raum erfolgreich gelöscht!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Löschen eines Raums.");
    }
  }

  /**
   * Die in der Ansicht (URL) ausgewählte Ressource, undefined falls keine gewählt ist oder sie nicht existiert
   */
  const selectedRoom = computed(() => {
    const id = viewStore.view.selected[Tab.ROOM];
    return id === undefined ? undefined : roomMap.value.get(id);
  });

  return {
    roomMap,
    createRoom,
    readRoom,
    updateRoom,
    deleteRoom,
    selectedRoom,
    roomList,
  };
});
