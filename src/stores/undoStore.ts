import { defineStore } from "pinia";
import { ref } from "vue";
import { batchApi, type BatchOp } from "@/api/batch";
import { useNotification } from "@/composables/useNotification";
import { UndoManager, type SendBatch, type UndoResource } from "@/undo/undoManager";

export const timeSlotResource = "courseTimeSlot";
export const timeSlotRoomResource = "timeSlotRoomAssignment";
export const colorResource = "courseColor";
export const courseColorResource = "courseColorAssignment";

/** Ressourcen, die über den Rückgängig-Verlauf geändert werden können */
const resources: Record<string, UndoResource> = {
  [timeSlotResource]: {
    identity: "id",
    fields: ["course", "weekday", "at", "duration"],
    createOnly: ["one_off_date"],
  },
  [timeSlotRoomResource]: { identity: "data" },
  [colorResource]: {
    identity: "id",
    fields: ["name", "hex"],
  },
  [courseColorResource]: { identity: "data" },
  // werden beim Löschen eines Termins mitgelöscht (cascade)
  ignoredResourceConflict: { identity: "data" },
  ignoredLecturerConstraintViolation: { identity: "data" },
};

/**
 * Pinia Store für Rückgängig/Wiederholen (Strg+Z / Strg+Umschalt+Z bzw. Strg+Y)
 */
export const useUndoStore = defineStore("undo", () => {
  const { showError, showSuccess } = useNotification();

  const undoLabel = ref<string | undefined>();
  const redoLabel = ref<string | undefined>();

  let manager = createManager(batchApi);

  function createManager(send: SendBatch) {
    const m = new UndoManager(send, resources);
    m.onChange = () => {
      undoLabel.value = m.undoLabel;
      redoLabel.value = m.redoLabel;
    };
    return m;
  }

  /** Nur für Tests: Server-Aufruf austauschen */
  function setSender(send: SendBatch) {
    manager = createManager(send);
    manager.onChange?.();
  }

  /**
   * Führt eine Nutzeraktion aus und nimmt sie in den Verlauf auf
   */
  function perform(label: string, ops: BatchOp[]) {
    return manager.perform(label, ops);
  }

  async function step(direction: "undo" | "redo") {
    try {
      const result = await (direction === "undo" ? manager.undo() : manager.redo());
      if (!result) return;
      const verb = direction === "undo" ? "Rückgängig" : "Wiederholt";
      if (result.ok) {
        showSuccess(`${verb}: ${result.label}`);
      } else {
        showError(
          `${direction === "undo" ? "Rückgängig" : "Wiederholen"} nicht möglich`,
          `„${result.label}“: ${result.reason}. Die Änderung der anderen Person bleibt erhalten.`
        );
      }
    } catch (error) {
      const { handleError } = useNotification();
      handleError(
        error as Error,
        direction === "undo" ? "Fehler beim Rückgängigmachen" : "Fehler beim Wiederholen"
      );
    }
  }

  return {
    undoLabel,
    redoLabel,
    perform,
    undo: () => step("undo"),
    redo: () => step("redo"),
    clear: () => manager.clear(),
    setSender,
  };
});
