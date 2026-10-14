<template>
  <div class="container-fluid">
    <div class="row row-cols-8 g-3">
      <div v-for="c in colors" :key="c" class="col" @click="selectColor(c)">
        <color-box :hex="c" :button="true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import ColorBox from "./ColorBox.vue";

  const emit = defineEmits<{
    selectColor: [string];
  }>();

  const colors = ref<string[]>([]);

  colors.value = [
    "#87cdd5",
    "#59a7c2",
    "#5f4b9a",
    "#d45e9f",
    "#e88079",
    "#f2ae3e",
    "#fcde6e",
    "#aecc53",
  ];

  function selectColor(c: string) {
    emit("selectColor", c);
  }
</script>
