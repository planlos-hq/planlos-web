<template>
  <hint-card :title="t('hintCards.loadingHint.title')">
    <p class="m-0">{{ t("hintCards.loadingHint.body") }}</p>
    <!-- An der Stelle, an der die anderen Hinweise ihren Knopf haben -->
    <template #actions>
      <b-spinner class="spinner" :label="t('hintCards.loadingHint.spinnerLabel')" />
    </template>
  </hint-card>
</template>

<script setup lang="ts">
  import { BSpinner } from "bootstrap-vue-next";
  import HintCard from "./HintCard.vue";
  import { useI18n } from "vue-i18n";

  const { t } = useI18n();

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
