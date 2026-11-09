<template>
  <hint-card title="Daten werden geladen">
    <p class="m-0">Einen Moment, PlanLos holt die Daten vom Server.</p>
    <!-- An der Stelle, an der die anderen Hinweise ihren Knopf haben -->
    <template #actions>
      <b-spinner class="spinner" label="Lädt" />
    </template>
  </hint-card>
</template>

<script setup lang="ts">
  import { BSpinner } from "bootstrap-vue-next";
  import HintCard from "./HintCard.vue";

  /**
   * Hinweis, solange der erste Datenabruf beim Start läuft.
   * Braucht ein Elternelement mit position: relative.
   */
</script>

<style scoped>
  .spinner {
    color: var(--button-color);
    height: 3rem;
    width: 3rem;
  }
</style>
