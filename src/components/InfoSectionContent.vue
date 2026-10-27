<template>
  <div class="info-section selectable">
    <p v-if="section.text" class="info-text">{{ section.text }}</p>
    <p v-if="section.link">
      <a :href="section.link" target="_blank" rel="noopener noreferrer">{{ section.link }}</a>
    </p>
  </div>
</template>

<script setup lang="ts">
  import type { InfoSection } from "@/composables/useSiteSettings";

  defineProps<{
    section: InfoSection;
  }>();
</script>

<style scoped>
  .info-section p {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .info-text {
    white-space: pre-line;
  }
</style>
