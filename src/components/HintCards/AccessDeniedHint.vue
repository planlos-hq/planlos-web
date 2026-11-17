<template>
  <hint-card :title="t('hintCards.accessDeniedHint.title')" alert>
    <p class="m-0">
      <template v-if="username">
        <i18n-t keypath="hintCards.accessDeniedHint.accountNotApproved">
          <template #username>
            <strong>{{ username }}</strong>
          </template>
        </i18n-t>
      </template>
      <template v-else>{{ t("hintCards.accessDeniedHint.notEnabled") }}</template>
      {{ t("hintCards.accessDeniedHint.goToAdmin") }}
    </p>
    <template #actions>
      <b-button variant="primary" size="lg" @click="reload">
        <rotate-ccw :size="24" aria-hidden="true" />
        {{ t("common.retry") }}
      </b-button>
    </template>
  </hint-card>
</template>

<script setup lang="ts">
  import { BButton } from "bootstrap-vue-next";
  import { RotateCcw } from "lucide-vue-next";
  import HintCard from "./HintCard.vue";
  import { useI18n } from "vue-i18n";

  const { t } = useI18n();

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
