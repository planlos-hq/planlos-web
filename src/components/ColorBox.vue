<template>
  <div
    class="rounded-4 d-flex align-items-center justify-content-center"
    :class="{ 'color-tile-button': button }"
    :style="{
      backgroundColor: hex,
      color: calculateFontColor(hex),
      minHeight: size + 'px',
      width: size + 'px',
    }"
  >
    <div v-if="text" class="small px-1 w-100 text-center color-text" lang="de" :title="text">
      {{ abbreviateLabel(text) }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useAbbreviation } from "@/composables/useAbbreviation";
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
  const { abbreviateLabel } = useAbbreviation();
</script>

<style scoped>
  /* Lange Namen nur an Leerzeichen und "/" umbrechen, ab der dritten Zeile mit "…" abschneiden */
  .color-text {
    -webkit-box-orient: vertical;
    /* stylelint-disable-next-line value-no-vendor-prefix */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

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
