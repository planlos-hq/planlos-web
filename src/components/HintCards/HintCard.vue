<template>
  <!-- Mittig über dem Elternelement (braucht position: relative), blockiert nur unter der Karte -->
  <div class="hint">
    <div class="hint-card" :role="alert ? 'alert' : undefined">
      <h3 class="m-0">{{ title }}</h3>
      <div class="m-0 fs-5 text-muted">
        <slot />
      </div>
      <div v-if="$slots.actions" class="actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  /**
   * Hinweis-Karte mit Überschrift, Text und Knöpfen, z. B. wenn keine Semestergruppen
   * ausgewählt sind, der Server nicht erreichbar ist oder der Zugriff fehlt.
   */
  defineProps<{
    title: string;
    /** Für Fehler: Screenreader lesen die Karte sofort vor */
    alert?: boolean;
  }>();
</script>

<style scoped>
  .hint {
    align-items: center;
    display: flex;
    inset: 0;
    justify-content: center;
    padding: 1rem;
    pointer-events: none;
    position: absolute;
    z-index: 5;
  }

  .hint-card {
    align-items: center;
    background: var(--bs-body-bg);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 8%);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: auto;
    max-width: 34rem;
    padding: 2.5rem 3rem;
    pointer-events: auto;
    text-align: center;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
</style>
