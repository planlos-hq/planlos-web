<template>
  <icon-button
    :size="size"
    class="icon-button"
    :title="modelValue ? 'Alle Veranstaltungen' : 'Relevante Veranstaltungen'"
    @click="toggle"
  >
    <list-chevrons-up-down v-if="modelValue" :size="size" :stroke-width="1.5" class="icon" />
    <list-chevrons-down-up v-else :size="size" :stroke-width="1.5" class="icon" />
  </icon-button>
</template>

<script setup lang="ts">
  import IconButton from "@/template/IconButton.vue";
  import { ListChevronsDownUp, ListChevronsUpDown } from "lucide-vue-next";

  const props = defineProps<{
    /**Größe des Icons in px */
    size: number;
    /**Aktuelle Sortierrichtung */
    modelValue: boolean;
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
  }>();

  function toggle() {
    emit("update:modelValue", !props.modelValue);
  }
</script>
