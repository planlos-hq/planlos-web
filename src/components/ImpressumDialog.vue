<template>
  <base-info-button
    :label="t('infoDialogs.impressum')"
    :title="t('infoDialogs.impressum')"
    :offset="10"
  >
    <info-section-content :section="settings.impressum" />
  </base-info-button>
</template>

<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import BaseInfoButton from "@/template/BaseInfoButton.vue";
  import InfoSectionContent from "@/components/InfoSectionContent.vue";
  import { useSiteSettings } from "@/composables/useSiteSettings";

  const { t } = useI18n();
  const settings = useSiteSettings();
</script>
