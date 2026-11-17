<template>
  <hint-card :title="t(`hintCards.noSelectionHint.${keys[tab]}.title`)">
    <p class="m-0">{{ t(`hintCards.noSelectionHint.${keys[tab]}.body`) }}</p>
    <!-- Pfeil zur Liste in der Seitenleiste, an der Stelle der Knöpfe anderer Hinweise -->
    <template #actions>
      <arrow-left class="arrow" :size="40" aria-hidden="true" />
    </template>
  </hint-card>
</template>

<script setup lang="ts">
  import { ArrowLeft } from "lucide-vue-next";
  import { Tab } from "@/enums/enums";
  import HintCard from "./HintCard.vue";
  import { useI18n } from "vue-i18n";

  const { t } = useI18n();

  /**
   * Hinweis in den Tabs Lehrpersonen, Semestergruppen, Studiengänge und Räume,
   * solange links nichts ausgewählt ist und der Kalender deshalb leer bleibt.
   * Braucht ein Elternelement mit position: relative.
   */
  defineProps<{
    tab: Exclude<Tab, Tab.COURSE>;
  }>();

  /** Name des Tabs in hintCards.noSelectionHint.* der Locales */
  const keys: Record<Exclude<Tab, Tab.COURSE>, string> = {
    [Tab.LECTURER]: "lecturer",
    [Tab.STUDYGROUP]: "studyGroup",
    [Tab.DEGREEPROGRAM]: "degreeProgram",
    [Tab.ROOM]: "room",
  };
</script>

<style scoped>
  .arrow {
    color: var(--button-color);
  }
</style>
