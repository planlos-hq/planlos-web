<template>
  <div class="d-flex flex-row gap-3 justify-content-center align-items-start">
    <b-form-textarea
      id="input"
      type="text"
      placeholder="Name"
      v-model="key"
      required
      class="pb-0"
    />
    <b-form-textarea
      id="input"
      type="text"
      placeholder="Wert"
      v-model="value"
      required
      class="pb-0"
    />
    <delete-button :size="24" @click="$emit('onDelete')" class="mt-3" />
  </div>
</template>

<script setup lang="ts">
  import { BFormTextarea } from "bootstrap-vue-next";
  import DeleteButton from "./IconButtons/DeleteButton.vue";

  const key = defineModel<string>("name");
  const value = defineModel<string>("value");
  defineEmits<{
    /**
     * Wird aufgerufen, wenn der Deletebutton gedrückt wird.
     */
    onDelete: [void];
  }>();
</script>
