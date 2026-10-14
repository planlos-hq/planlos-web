<template>
  <icon-button :size="size" class="icon-button">
    <pencil :size="size" class="icon" />
  </icon-button>
</template>

<script setup lang="ts">
  import { Pencil } from "lucide-vue-next";
  import IconButton from "@/template/IconButton.vue";

  defineProps<{
    /**Größe des Icons in px */
    size: number;
  }>();
</script>

<style scoped>
  .icon-button {
    padding: 4px;
  }
</style>
