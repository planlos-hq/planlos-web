<template>
  <hint-card title="Keine Verbindung zum Server" alert>
    <p class="m-0">
      Der Server ist gerade nicht erreichbar. Bitte später erneut versuchen oder an den
      Administrator wenden.
    </p>
    <p v-if="connectionError" class="error-code mt-2 mb-0">
      Fehlercode: <code>{{ errorCodeLabel }}</code>
    </p>
    <template #actions>
      <b-button variant="primary" size="lg" @click="reload">
        <rotate-ccw :size="24" aria-hidden="true" />
        Erneut versuchen
      </b-button>
    </template>
  </hint-card>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import { storeToRefs } from "pinia";
  import { BButton } from "bootstrap-vue-next";
  import { RotateCcw } from "lucide-vue-next";
  import { useConnectionStore } from "@/stores/connectionStore";
  import HintCard from "./HintCard.vue";

  /**
   * Hinweis auf allen Tabs, wenn der Server nicht erreichbar ist.
   * Braucht ein Elternelement mit position: relative.
   */
  const { connectionError } = storeToRefs(useConnectionStore());

  const errorCodeLabel = computed(() => {
    if (!connectionError.value) return "";
    const { code, httpStatus } = connectionError.value;
    return httpStatus !== undefined ? `${code} (HTTP ${httpStatus})` : code;
  });

  /** Lädt die Anwendung neu, die Daten werden dabei erneut vom Server geholt */
  function reload() {
    window.location.reload();
  }
</script>

<style scoped>
  .error-code,
  .error-code code {
    font-size: 1rem;
  }

  .error-code code {
    color: var(--button-color);
  }
</style>
