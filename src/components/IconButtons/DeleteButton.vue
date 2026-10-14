<template>
  <icon-button :size="size" class="icon-button">
    <trash2 :size="size" class="icon" />
  </icon-button>
</template>

<script setup lang="ts">
  import { Trash2 } from "lucide-vue-next";
  import IconButton from "@/template/IconButton.vue";

  defineProps<{
    /**Größe des Icons in px */
    size: number;
  }>();
</script>
