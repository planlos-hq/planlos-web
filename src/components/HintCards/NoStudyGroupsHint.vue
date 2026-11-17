<template>
  <hint-card :title="t('hintCards.noStudyGroupsHint.title')">
    {{ t("hintCards.noStudyGroupsHint.body") }}
    <template #actions>
      <b-button variant="primary" size="lg" @click="openSettings('groups')">
        <users :size="24" aria-hidden="true" />
        {{ t("hintCards.noStudyGroupsHint.action") }}
      </b-button>
    </template>
  </hint-card>
</template>

<script setup lang="ts">
  import { BButton } from "bootstrap-vue-next";
  import { Users } from "lucide-vue-next";
  import { useSettingsDialog } from "@/composables/useSettingsDialog";
  import HintCard from "./HintCard.vue";
  import { useI18n } from "vue-i18n";

  /**
   * Hinweis im Veranstaltungs-Tab, wenn keine Semestergruppe ausgewählt ist.
   * Der Knopf öffnet die Einstellungen bei der Auswahl der Semestergruppen.
   * Braucht ein Elternelement mit position: relative.
   */
  const { t } = useI18n();
  const { openSettings } = useSettingsDialog();
</script>
