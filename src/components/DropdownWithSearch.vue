<template>
  <div class="d-flex flex-row justify-content-between align-items-center">
    <b-dropdown
      placement="left-start"
      offset="5px"
      variant="light"
      auto-close="outside"
      strategy="fixed"
      :disabled="disabled"
    >
      <template #button-content>
        <b-form-text>{{ buttonText }}</b-form-text>
      </template>
      <list-with-search
        :items="items"
        :draggable="false"
        :max-height="200"
        :is-item-selected="isItemSelected"
        @toggle="id => $emit('toggle', id)"
      >
        <template #listElement="{ item }">
          <slot name="listElement" :item="item"></slot>
        </template>
      </list-with-search>
    </b-dropdown>
    <reset-button :size="24" class="p-1" @click="resetMultiSelect()" />
  </div>
</template>

<script setup lang="ts" generic="T extends { id: number }">
  import { BDropdown, BFormText } from "bootstrap-vue-next";
  import ListWithSearch from "./ListWithSearch.vue";
  import ResetButton from "./IconButtons/ResetButton.vue";
  const props = defineProps<{
    /**Text der zum Öffnen der Auswahl angezeigt wird */
    buttonText: string;
    /**Liste, aus der Elemente ausgesucht werden sollen */
    items: T[];
    /**Funktion, die zurückgibt, ob ein Element aktuell ausgewählt ist. Funktioniert nur mit Elementen, die eine id besitzen.   */
    isItemSelected: (item: T) => boolean;
    /**gibt an, ob die Auwahl geöffnet werden kann oder nicht */
    disabled: boolean;
  }>();

  const emit = defineEmits<{
    /**Wird bei der Auswahl eines Elements aufgerufen. Übergibt die id des aufgerufenen Elements. */
    toggle: [number];
  }>();

  /**
   * Emitted für jedes selektierte Item, dass dieses entfernt werden soll
   */
  function resetMultiSelect() {
    const copy = [...props.items];
    copy.forEach(i => {
      if (props.isItemSelected(i)) {
        emit("toggle", i.id);
      }
    });
  }
</script>
