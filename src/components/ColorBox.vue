<template>
  <div
    class="rounded-4 d-flex align-items-center justify-content-center"
    :class="{ 'color-tile-button': button }"
    :style="{
      backgroundColor: hex,
      color: calculateFontColor(hex),
      height: size + 'px',
      width: size + 'px',
    }"
  >
    <div v-if="text" class="small">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
  import { useColor } from "@/composables/useColor";

  withDefaults(
    defineProps<{
      /**Hex-Wert der Farbe */
      hex: string;
      /**Soll die Farbe als Knopf dienen? */
      button: boolean;
      /**Text, der in die Farbe geschrieben wird */
      text?: string;
      /**Größe des Feldes */
      size?: number;
    }>(),
    {
      text: "",
      size: 40,
    }
  );

  const { calculateFontColor } = useColor();
</script>

<style scoped>
  .color-tile-button {
    cursor: pointer;
    transition: transform 0.2s ease-in-out;
  }

  .color-tile-button:hover {
    transform: scale(1.2);
  }

  .color-tile-button:active {
    transform: scale(1.1);
  }
</style>
