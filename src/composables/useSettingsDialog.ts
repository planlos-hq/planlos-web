import { ref } from "vue";

/** Offen-Zustand der Einstellungen, geteilt zwischen Seitenleiste und Planungsansicht */
const show = ref(false);
/** Offener Bereich, Ansicht zuerst */
const section = ref("view");
/** Einstellung, zu der beim Öffnen gesprungen wird (id eines Sucheintrags, z. B. "groups") */
const focus = ref<string | null>(null);

/**
 * Steuert die Einstellungen von überall in der App.
 *
 * @returns show, section, focus und openSettings
 */
export function useSettingsDialog() {
  /**
   * Öffnet die Einstellungen und springt optional zu einer Einstellung.
   *
   * @param target - id eines Sucheintrags der Einstellungen, z. B. "groups"
   */
  function openSettings(target?: string) {
    focus.value = target ?? null;
    show.value = true;
  }

  return { show, section, focus, openSettings };
}
