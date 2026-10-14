<template>
  <base-info-button label="Hilfe" title="Hilfe" :offset="180">
    <info-section-content class="text-center" :section="settings.help" />
  </base-info-button>
</template>

<script setup lang="ts">
  import BaseInfoButton from "@/template/BaseInfoButton.vue";
  import InfoSectionContent from "@/components/InfoSectionContent.vue";
  import { useSiteSettings } from "@/composables/useSiteSettings";

  const settings = useSiteSettings();
</script>
