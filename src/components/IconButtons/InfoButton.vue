<template>
  <icon-button :size="size" @click="goToUrl" class="icon-button">
    <info :size="size" class="icon" />
  </icon-button>
</template>

<script setup lang="ts">
  import { Info } from "lucide-vue-next";
  import IconButton from "@/template/IconButton.vue";

  const props = defineProps<{
    /**Größe des Icons in px */
    size: number;
    /**auf welche URL der Button weiterleiten soll */
    url: string;
  }>();

  function goToUrl() {
    window.open(props.url, "_blank");
    //gegebenfalls zwischen Web-Url und Vue-Router unterscheiden
  }
</script>

<style scoped>
  .icon-button {
    padding: 1%;
  }
</style>
