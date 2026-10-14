<template>
  <icon-button :size="size" class="icon-button" :class="{ inactive: ignored }">
    <lucide-calendar-search></lucide-calendar-search>
  </icon-button>
</template>

<script setup lang="ts">
  import { LucideCalendarSearch } from "lucide-vue-next";
  import IconButton from "@/template/IconButton.vue";

  defineProps<{
    /**Größe des Icons in px */
    size: number;
    ignored: boolean;
  }>();
</script>

<style scoped>
  .icon-button {
    padding: 1%;
  }

  .inactive {
    opacity: 0.5;
  }
</style>
