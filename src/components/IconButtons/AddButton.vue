<template>
  <b-button variant="primary" class="d-flex align-items-center justify-content-center">
    <plus :size="size" />
  </b-button>
</template>

<script setup lang="ts">
  import { Plus } from "lucide-vue-next";
  import { BButton } from "bootstrap-vue-next";

  withDefaults(
    defineProps<{
      /**Größe des Plus-Icons in px */
      size?: number;
    }>(),
    { size: 24 }
  );
</script>
