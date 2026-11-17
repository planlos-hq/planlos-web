<template>
  <base-info-button :label="t('infoDialogs.help')" :title="t('infoDialogs.help')" :offset="180">
    <info-section-content class="text-center" :section="settings.help" />
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
