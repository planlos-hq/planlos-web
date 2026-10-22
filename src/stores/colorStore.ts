import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Color } from "@/models/Color";
import { useNotification } from "@/composables/useNotification";
import { colorResource, useUndoStore } from "@/stores/undoStore";

/**
 * Pinia Store für die Verwaltung von Farben für die Farblegende
 *
 * @returns Ein Objekt mit:
 * - colorList: Reaktive Liste aller Farben
 * - createColor: Funktion zum Erstellen einer neuen Farbe
 * - readColor: Funktion zum Abrufen einer Farbe per ID
 * - updateColor: Funktion zum Aktualisieren einer Farbe
 * - deleteColor: Funktion zum Löschen einer Farbe
 */
export const useColorStore = defineStore("colors", () => {
  const colorMap = ref<Map<number, Color>>(new Map<number, Color>());
  const colorList = computed(() => Array.from(colorMap.value.values()));
  const { showSuccess, showError, handleError } = useNotification();

  /**
   * Erstellt eine neue Farbe und fügt sie zur Farb-Liste hinzu
   *
   * @param name - Name der Farbe
   * @param hex - Hexcode der die Farbe beinhaltet
   */
  async function createColor(name: string, hex: string) {
    const undoStore = useUndoStore();
    try {
      await undoStore.perform("Farbe anlegen", [
        {
          kind: "create",
          resource: colorResource,
          data: { name, hex: hex.toUpperCase() },
        },
      ]);

      showSuccess("Farbe erfolgreich hinzugefügt!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Erstellen einer Farbe.");
    }
  }

  /**
   * Sucht eine Farbe anhand ihrer ID
   *
   * @param id - Die eindeutige ID der Farbe
   * @returns Die gefundene Farbe oder undefined, falls nicht vorhanden
   */
  function readColor(id: number): Color | undefined {
    const color = colorMap.value.get(id);
    if (!color) {
      showError("Fehler", "Die Farbe konnte nicht gefunden werden.");
    }
    return color;
  }

  /**
   * Aktualisiert eine existierende Farbe mit neuen Werten
   *
   * @param id - Die eindeutige ID der Farbe
   * @param updates - Ein Objekt mit den zu aktualisierenden Feldern (ohne ID)
   *
   * @example updateColor(12345, \{ name: "Neue Farbe", hex: "#FFFFFF" \});
   */
  async function updateColor(id: number, updates: Partial<Omit<Color, "id">>) {
    const undoStore = useUndoStore();
    try {
      if (updates.hex !== undefined) {
        updates.hex = updates.hex.toUpperCase();
      }

      await undoStore.perform("Farbe bearbeiten", [
        {
          kind: "update",
          resource: colorResource,
          id,
          set: { ...updates },
        },
      ]);
      showSuccess("Farbe erfolgreich aktualisiert!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Aktualisieren der Farbe!");
    }
  }

  /**
   * Löscht eine Farbe anhand ihrer ID
   *
   * @param id - Die eindeutige ID der Farbe
   */
  async function deleteColor(id: number) {
    const undoStore = useUndoStore();
    try {
      await undoStore.perform("Farbe löschen", [{ kind: "delete", resource: colorResource, id }]);

      showSuccess("Farbe erfolgreich gelöscht!");
    } catch (error) {
      const e = error as Error;
      handleError(e, "Fehler beim Löschen der Farbe.");
    }
  }

  return { colorMap, colorList, createColor, readColor, updateColor, deleteColor };
});
