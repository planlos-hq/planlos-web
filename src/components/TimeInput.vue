<template>
  <b-input
    v-model="text"
    :placeholder="formatMinutes(13 * 60 + 30)"
    autocomplete="off"
    @blur="commit"
    @keydown.enter.prevent="commit"
  />
</template>

<script setup lang="ts">
  import { ref, watch } from "vue";
  import { BInput } from "bootstrap-vue-next";
  import { toTimeValue, useTimeFormat } from "@/composables/useTimeFormat";

  /**
   * Uhrzeitfeld im Format der eingestellten Sprache (statt <input type="time">, das sich nach der
   * Sprache des Browsers richtet). Der Wert bleibt "HH:MM" in 24 Stunden.
   */
  const model = defineModel<string>({ required: true });
  const emit = defineEmits<{
    /** Nach Verlassen des Feldes oder Enter, mit der übernommenen Uhrzeit als "HH:MM" */
    change: [value: string];
  }>();

  const { formatMinutes, parse } = useTimeFormat();

  const fromValue = (value: string) => {
    const [hours = 0, minutes = 0] = value.split(":").map(Number);
    return formatMinutes(hours * 60 + minutes);
  };

  const text = ref("");
  watch([model, () => formatMinutes(0)], () => (text.value = fromValue(model.value)), {
    immediate: true,
  });

  /** Übernimmt die Eingabe; ist sie ungültig, steht wieder die alte Uhrzeit im Feld */
  function commit() {
    const minutes = parse(text.value);
    if (minutes === undefined) {
      text.value = fromValue(model.value);
      return;
    }
    const value = toTimeValue(minutes);
    model.value = value;
    text.value = fromValue(value);
    emit("change", value);
  }
</script>
