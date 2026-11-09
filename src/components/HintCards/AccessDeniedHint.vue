<template>
  <hint-card title="Kein Zugriff" alert>
    <p class="m-0">
      <template v-if="username">
        Das Konto <strong>{{ username }}</strong> ist für PlanLos nicht freigeschaltet.
      </template>
      <template v-else>Dieses Konto ist für PlanLos nicht freigeschaltet.</template>
      Bitte an den Administrator wenden.
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
  import { BButton } from "bootstrap-vue-next";
  import { RotateCcw } from "lucide-vue-next";
  import HintCard from "./HintCard.vue";

  /**
   * Hinweis auf allen Tabs, wenn der Server den Zugriff verweigert (403).
   * Braucht ein Elternelement mit position: relative.
   */
  defineProps<{
    /** Konto laut Server, falls bekannt */
    username: string | null;
  }>();

  /** Nach der Freischaltung die Daten neu laden */
  function reload() {
    window.location.reload();
  }
</script>
