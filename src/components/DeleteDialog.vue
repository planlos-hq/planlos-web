<template>
  <b-modal
    :title="title"
    centered
    :ok-title="okTitle"
    ok-variant="danger"
    :ok-disabled="confirmText !== 'Bestätigen'"
    @ok="confirm"
    ok-only
    lazy
    unmount-lazy
    no-animation
    @hidden="confirmText = ''"
  >
    <b-list-group-item class="d-flex flex-column align-items-center justify-content-center">
      <slot></slot>
    </b-list-group-item>
    <p class="mt-3 mb-1">
      Tippen Sie
      <button
        type="button"
        class="confirm-word"
        title="Klicken, um „Bestätigen“ einzutragen"
        @click="fillConfirmText"
      >
        <strong>{{ confirmWord }}</strong>
        <copy :size="14" class="ms-1" />
      </button>
      ein, um {{ action }}:
    </p>
    <b-form-input
      v-model="confirmText"
      :placeholder="confirmWord"
      :state="isConfirmed ? true : null"
    />
  </b-modal>
</template>

<script setup lang="ts">
  import { computed, ref } from "vue";
  import { BModal, BListGroupItem, BFormInput } from "bootstrap-vue-next";
  import { Copy } from "lucide-vue-next";

  const confirmWord = "Bestätigen";

  withDefaults(
    defineProps<{
      /** Überschrift des Dialogs */
      title?: string;
      /** Beschriftung des Bestätigen-Knopfs */
      okTitle?: string;
      /** Was die Bestätigung auslöst, z. B. "den Eintrag zu löschen" */
      action?: string;
    }>(),
    {
      title: "Folgenden Eintrag wirklich löschen?",
      okTitle: "Löschen",
      action: "den Eintrag zu löschen",
    }
  );

  const emit = defineEmits<{
    /** Eintrag darf endgültig gelöscht werden */
    confirm: [void];
  }>();

  const confirmText = ref("");
  const isConfirmed = computed(() => confirmText.value === confirmWord);

  function fillConfirmText() {
    confirmText.value = confirmWord;
  }

  /**
   * Bestätigt das Löschen des Eintrags
   */
  function confirm() {
    emit("confirm");
  }
</script>

<style scoped lang="css">
  .confirm-word {
    align-items: center;
    background: var(--bs-primary-bg-subtle);
    border: 1px solid var(--bs-primary);
    border-radius: 0.375rem;
    color: var(--bs-primary-text-emphasis);
    cursor: pointer;
    display: inline-flex;
    padding: 0 0.4rem;
    transition: background-color 0.15s;
  }

  .confirm-word:hover {
    background: var(--bs-primary-border-subtle);
  }
</style>
