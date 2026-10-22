<template>
  <icon-button :size="size" class="icon-button">
    <undo2 :size="size" />
  </icon-button>
</template>

<script setup lang="ts">
  import { Undo2 } from "lucide-vue-next";
  import IconButton from "@/template/IconButton.vue";

  defineProps<{
    /**Größe des Icons in px */
    size: number;
  }>();
</script>

<style scoped>
  .icon-button {
    padding: 1%;
  }
</style>
