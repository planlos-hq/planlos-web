<template>
  <b-modal
    :title="title ?? t('deleteDialog.title')"
    centered
    :ok-title="okTitle ?? t('common.delete')"
    ok-variant="danger"
    :ok-disabled="!isConfirmed"
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
    <i18n-t keypath="deleteDialog.prompt" tag="p" class="mt-3 mb-1">
      <template #word>
        <button
          type="button"
          class="confirm-word"
          :title="t('deleteDialog.fillTitle', { word: confirmWord })"
          @click="fillConfirmText"
        >
          <strong>{{ confirmWord }}</strong>
          <copy :size="14" class="ms-1" />
        </button>
      </template>
      <template #action>{{ action ?? t("deleteDialog.defaultAction") }}</template>
    </i18n-t>
    <b-form-input
      v-model="confirmText"
      :placeholder="confirmWord"
      :state="isConfirmed ? true : null"
    />
  </b-modal>
</template>

<script setup lang="ts">
  import { computed, ref } from "vue";
  import { useI18n } from "vue-i18n";
  import { BModal, BListGroupItem, BFormInput } from "bootstrap-vue-next";
  import { Copy } from "lucide-vue-next";

  const { t } = useI18n();

  /** Wort, das zur Bestätigung eingetippt werden muss */
  const confirmWord = computed(() => t("deleteDialog.confirmWord"));

  defineProps<{
    /** Überschrift des Dialogs */
    title?: string;
    /** Beschriftung des Bestätigen-Knopfs */
    okTitle?: string;
    /** Was die Bestätigung auslöst, z. B. "den Eintrag zu löschen" */
    action?: string;
  }>();

  const emit = defineEmits<{
    /** Eintrag darf endgültig gelöscht werden */
    confirm: [void];
  }>();

  const confirmText = ref("");
  const isConfirmed = computed(() => confirmText.value === confirmWord.value);

  function fillConfirmText() {
    confirmText.value = confirmWord.value;
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
