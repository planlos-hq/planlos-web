<template>
  <b-modal
    title="Folgenden Eintrag wirklich löschen?"
    centered
    ok-title="Löschen"
    ok-variant="danger"
    cancel-title="Abbrechen"
    :ok-disabled="confirmText !== 'Bestätigen'"
    @ok="confirm"
    lazy
    unmount-lazy
    no-animation
    @hidden="confirmText = ''"
  >
    <b-list-group-item class="d-flex flex-column align-items-center justify-content-center">
      <slot></slot>
    </b-list-group-item>
    <p class="mt-3 mb-1">Tippen Sie <strong>Bestätigen</strong> ein, um den Eintrag zu löschen:</p>
    <b-form-input v-model="confirmText" placeholder="Bestätigen" />
  </b-modal>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import { BModal, BListGroupItem, BFormInput } from "bootstrap-vue-next";

  const emit = defineEmits<{
    /** Eintrag darf endgültig gelöscht werden */
    confirm: [void];
  }>();

  const confirmText = ref("");

  /**
   * Bestätigt das Löschen des Eintrags
   */
  function confirm() {
    emit("confirm");
  }
</script>
