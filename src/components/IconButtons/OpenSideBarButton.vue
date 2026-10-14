<template>
  <icon-button @click="isOpen = !isOpen" :size="size" class="icon-button">
    <panel-right-open :size="size" class="icon" v-if="!isOpen" />
    <panel-left-open :size="size" class="icon" v-if="isOpen" />
  </icon-button>
</template>

<script setup lang="ts">
  import { PanelRightOpen } from "lucide-vue-next";
  import { PanelLeftOpen } from "lucide-vue-next";
  import IconButton from "@/template/IconButton.vue";
  import { ref } from "vue";

  const props = defineProps<{
    /**Größe des Icons in px */
    size: number;
    /**Ist der Button zu Beginn geöffnet */
    open: boolean;
  }>();

  const isOpen = ref(props.open);
</script>

<style scoped>
  .icon-button {
    padding: 4px;
  }
</style>
