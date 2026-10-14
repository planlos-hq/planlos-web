import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Room } from "@/models/Room";
import { createRoomApi, deleteRoomApi, updateRoomApi } from "@/api/room";
import { useNotification } from "@/composables/useNotification";
import { mapRoomUpdatesToApi } from "@/api/util";

/**
 * Pinia Store für die Verwaltung von Räumen
 *
 * @returns Ein Objekt mit:
 * - roomList: Reaktive Liste aller Räume
 * - selectedRoomId: Id des (in der Verwaltungsansicht) ausgewählten Raumes
 * - selectedRoom: Ermittelt den gewählten Raum anhand der selectedRoomId
 * - createRoom: Funktion zum Erstellen eines neuen Raums
 * - readRoom: Funktion zum Abrufen eines Raums per ID
 * - updateRoom: Funktion zum Aktualisieren eines Raums
 * - deleteRoom: Funktion zum Löschen eines Raums
 * - selectRoom: Funktion zum Setzen der selectedRoomId
 */
export const useRoomStore = defineStore("rooms", () => {
  const roomMap = ref<Map<number, Room>>(new Map<number, Room>());
  const roomList = computed(() => Array.from(roomMap.value.values()));
  const selectedRoomId = ref<number | null>(null);
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
   * Dient der Auswahl eines Raums. Setzt dafür die selectedRoomId.
   *
   * @param id - eindeutige ID des Raums
   */
  function selectRoom(id: number | null) {
    selectedRoomId.value = id;
  }

  /**
   * Ermittelt den gewählte Raum basierend auf der selectedRoomId
   *
   * @returns ausgewählter Raum
   */
  const selectedRoom = computed(() => {
    const index = roomList.value.findIndex(room => room.id === selectedRoomId.value);
    return roomList.value[index];
  });

  return {
    roomMap,
    createRoom,
    readRoom,
    updateRoom,
    deleteRoom,
    selectedRoomId,
    selectRoom,
    selectedRoom,
    roomList,
  };
});
