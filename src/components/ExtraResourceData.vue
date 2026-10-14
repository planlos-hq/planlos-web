<template>
  <div>
    <p class="m-0 p-0 mt-4">zusätzliche Daten:</p>
    <div class="d-flex flex-column justify-content-center align-items-center gap-2">
      <p v-if="localPairs.length === 0" class="m-0">------------</p>
      <key-value-input
        v-for="(pair, index) in localPairs"
        :key="pair.id"
        :name="pair.key"
        :value="pair.value"
        @update:name="val => updatePair(index, 'key', val)"
        @update:value="val => updatePair(index, 'value', val)"
        class="mb-1"
        @on-delete="removePair(index)"
      />
      <plus-button :size="24" @click="addNewPair" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from "vue";
  import PlusButton from "./IconButtons/PlusButton.vue";
  import KeyValueInput from "./KeyValueInput.vue";

  type KeyValuePair = { id: number; key: string; value: string };

  const data = defineModel<Record<string, string>>({ default: () => ({}) });

  let uniqueId = 0;
  const localPairs = ref<KeyValuePair[]>([]);

  watch(
    () => data.value,
    newData => {
      const current = pairsToRecord(localPairs.value);
      //Verhindert Endlosschleife, da data gleichzeitig verändert und überwacht wird
      if (JSON.stringify(current) !== JSON.stringify(newData)) {
        localPairs.value = recordToPairs(newData);
      }
    },
    { immediate: true }
  );

  /**
   * Castet ein Key-Value-Pair zu einem Record
   * @param pairs - Ein Key-Value-Pair, dass zu einem Record gecastet werden soll
   * @returns Record
   */
  function pairsToRecord(pairs: KeyValuePair[]): Record<string, string> {
    const notEmptyPairs = pairs.filter(p => p.key.trim() !== "");
    const keyValue = notEmptyPairs.map(p => [p.key, p.value]);
    return Object.fromEntries(keyValue);
  }

  /**
   * Castet ein Record zu einem Key-Value-Pair
   * @param pairs - Ein Record, dass zu einem Key-Value-Pair gecastet werden soll
   * @returns KeyValuePair
   */
  function recordToPairs(record: Record<string, string>): KeyValuePair[] {
    const keyValue = Object.entries(record);
    return keyValue.map(([key, value]) => ({ id: uniqueId++, key, value }));
  }

  /**
   *
   * @param index - Stelle, wo das Pair angezeigt wird in der Liste
   * @param field - Key oder Value
   * @param val - Der neue Wert für Key oder Value
   */
  function updatePair(index: number, field: "key" | "value", val: string | undefined) {
    if (!localPairs.value[index]) {
      return;
    }
    localPairs.value[index][field] = val ?? "";
    data.value = pairsToRecord(localPairs.value);
  }

  /**
   * Fügt ein leeres Pair ein
   */
  function addNewPair() {
    localPairs.value.push({ id: uniqueId++, key: "", value: "" });
  }

  /**
   * Löscht ein Pair.
   * @param index - Stelle des Pairs, welches gelöscht werden soll
   */
  function removePair(index: number) {
    localPairs.value.splice(index, 1);
    data.value = pairsToRecord(localPairs.value);
  }
</script>
