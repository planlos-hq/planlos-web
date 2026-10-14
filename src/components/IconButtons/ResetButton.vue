<template>
  <icon-button :size="size" class="icon-button">
    <rotate-ccw :size="size" />
  </icon-button>
</template>

<script setup lang="ts">
  import { RotateCcw } from "lucide-vue-next";
  import IconButton from "@/template/IconButton.vue";

  defineProps<{
    /**Größe des Icons in px */
    size: number;
  }>();
</script>
