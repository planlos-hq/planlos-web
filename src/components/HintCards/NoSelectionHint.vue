<template>
  <hint-card :title="text[tab].title">
    <p class="m-0">{{ text[tab].body }}</p>
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

  /**
   * Hinweis in den Tabs Lehrpersonen, Semestergruppen, Studiengänge und Räume,
   * solange links nichts ausgewählt ist und der Kalender deshalb leer bleibt.
   * Braucht ein Elternelement mit position: relative.
   */
  defineProps<{
    tab: Exclude<Tab, Tab.COURSE>;
  }>();

  const text: Record<Exclude<Tab, Tab.COURSE>, { title: string; body: string }> = {
    [Tab.LECTURER]: {
      title: "Keine Lehrperson ausgewählt",
      body: "Wähle links eine Lehrperson aus, um ihren Stundenplan zu sehen.",
    },
    [Tab.STUDYGROUP]: {
      title: "Keine Semestergruppe ausgewählt",
      body: "Wähle links eine Semestergruppe aus, um ihren Stundenplan zu sehen.",
    },
    [Tab.DEGREEPROGRAM]: {
      title: "Kein Studiengang ausgewählt",
      body: "Wähle links einen Studiengang aus, um die Stundenpläne seiner Semestergruppen zu sehen.",
    },
    [Tab.ROOM]: {
      title: "Kein Raum ausgewählt",
      body: "Wähle links einen Raum aus, um seine Belegung zu sehen.",
    },
  };
</script>

<style scoped>
  .arrow {
    color: var(--button-color);
  }
</style>
