<template>
  <icon-button :size="size" class="icon-button">
    <graduation-cap :size="size" />
  </icon-button>
</template>

<script setup lang="ts">
  import { GraduationCap } from "lucide-vue-next";
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
