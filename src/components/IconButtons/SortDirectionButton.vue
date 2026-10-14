<template>
  <icon-button
    :size="size"
    class="icon-button"
    :title="modelValue === 'asc' ? 'Aufsteigend' : 'Absteigend'"
    @click="toggle"
  >
    <arrow-up-a-z v-if="modelValue === 'asc'" :size="size" :stroke-width="1.5" class="icon" />
    <arrow-down-z-a v-else :size="size" :stroke-width="1.5" class="icon" />
  </icon-button>
</template>

<script setup lang="ts">
  import { ArrowUpAZ, ArrowDownZA } from "lucide-vue-next";
  import IconButton from "@/template/IconButton.vue";

  const props = defineProps<{
    /**Größe des Icons in px */
    size: number;
    /**Aktuelle Sortierrichtung */
    modelValue: "asc" | "desc";
  }>();

  const emit = defineEmits(["update:modelValue"]);

  function toggle() {
    emit("update:modelValue", props.modelValue === "asc" ? "desc" : "asc");
  }
</script>
