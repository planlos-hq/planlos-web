<template>
  <base-info-button label="Impressum" title="Impressum" :offset="10">
    <info-section-content :section="settings.impressum" />
  </base-info-button>
</template>

<script setup lang="ts">
  import BaseInfoButton from "@/template/BaseInfoButton.vue";
  import InfoSectionContent from "@/components/InfoSectionContent.vue";
  import { useSiteSettings } from "@/composables/useSiteSettings";

  const settings = useSiteSettings();
</script>
