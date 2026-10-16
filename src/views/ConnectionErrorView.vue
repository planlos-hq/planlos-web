<template>
  <div class="connection-error-view">
    <div class="connection-error-card">
      <img src="/logo/PlanLos_logo_schrift.png" alt="PlanLos Logo" class="logo mb-4" />
      <div class="message-box" role="alert">
        <p class="fw-semibold mb-2">Es ist keine Verbindung zum Server möglich.</p>
        <p class="text-body-secondary mb-3">
          Bitte versuchen Sie es später erneut oder wenden Sie sich an Ihren Administrator.
        </p>
        <p v-if="connectionError" class="error-code mb-0">
          Fehlercode: <code>{{ errorCodeLabel }}</code>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import { storeToRefs } from "pinia";
  import { useConnectionStore } from "@/stores/connectionStore";

  const { connectionError } = storeToRefs(useConnectionStore());

  const errorCodeLabel = computed(() => {
    if (!connectionError.value) return "";
    const { code, httpStatus } = connectionError.value;
    return httpStatus !== undefined ? `${code} (HTTP ${httpStatus})` : code;
  });
</script>

<style scoped>
  /* html/body haben overflow: hidden, daher scrollt die Ansicht selbst, falls der Platz nicht reicht */
  .connection-error-view {
    display: flex;
    height: 100vh;
    overflow-y: auto;
    padding: 1rem;
    width: 100vw;
  }

  .connection-error-card {
    align-items: center;
    border: 1px solid var(--border-color);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    margin: auto;
    max-width: 640px;
    padding: 3rem 2rem;
    width: 100%;
  }

  .logo {
    height: auto;
    max-width: 200px;
  }

  .message-box {
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    text-align: center;
  }

  .error-code code {
    color: var(--button-color);
    font-size: 1rem;
  }
</style>
