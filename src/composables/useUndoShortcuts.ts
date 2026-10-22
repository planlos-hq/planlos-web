import { onMounted, onUnmounted } from "vue";
import { useUndoStore } from "@/stores/undoStore";

/** In Eingabefeldern bleibt das normale Text-Rückgängig des Browsers aktiv. */
function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * Registriert Strg+Z (Rückgängig) sowie Strg+Umschalt+Z und Strg+Y (Wiederholen)
 */
export function useUndoShortcuts() {
  const undoStore = useUndoStore();

  function onKeydown(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || isTextInput(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      undoStore.undo();
    } else if ((key === "z" && event.shiftKey) || key === "y") {
      event.preventDefault();
      undoStore.redo();
    }
  }

  onMounted(() => window.addEventListener("keydown", onKeydown));
  onUnmounted(() => window.removeEventListener("keydown", onKeydown));
}
