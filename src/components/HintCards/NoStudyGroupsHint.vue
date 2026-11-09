<template>
  <hint-card title="Keine Semestergruppen ausgewählt">
    Wähle aus, welche Semestergruppen du planen möchtest.
    <template #actions>
      <b-button variant="primary" size="lg" @click="openSettings('groups')">
        <users :size="24" aria-hidden="true" />
        Semestergruppen auswählen
      </b-button>
    </template>
  </hint-card>
</template>

<script setup lang="ts">
  import { BButton } from "bootstrap-vue-next";
  import { Users } from "lucide-vue-next";
  import { useSettingsDialog } from "@/composables/useSettingsDialog";
  import HintCard from "./HintCard.vue";

  /**
   * Hinweis im Veranstaltungs-Tab, wenn keine Semestergruppe ausgewählt ist.
   * Der Knopf öffnet die Einstellungen bei der Auswahl der Semestergruppen.
   * Braucht ein Elternelement mit position: relative.
   */
  const { openSettings } = useSettingsDialog();
</script>
