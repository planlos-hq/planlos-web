<template>
  <div>
    <p class="text-muted small mb-3">
      {{ t("settings.import.description") }}
    </p>

    <file-drop-zone
      :model-value="selectedFile"
      :accept="['.csv', '.xlsx']"
      @update:model-value="selectFile"
    />

    <div class="d-flex justify-content-end mt-3">
      <b-button variant="primary" :disabled="!selectedFile || isImporting" @click="submitImport">
        <b-spinner v-if="isImporting" small class="me-1" />
        {{ isImporting ? t("settings.import.submitting") : t("common.import") }}
      </b-button>
    </div>

    <b-alert
      v-if="importResult"
      :variant="importResult.success ? 'success' : 'danger'"
      class="mt-3 mb-0"
      :model-value="true"
      dismissible
      @dismissed="importResult = null"
    >
      {{ importResult.message }}
    </b-alert>
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import { useI18n } from "vue-i18n";
  import { BAlert, BButton, BSpinner } from "bootstrap-vue-next";
  import FileDropZone from "./FileDropZone.vue";
  import { useNotification } from "@/composables/useNotification";
  import { reloadAllData } from "@/api/globalGalactic";

  /** CSV/Excel-Import: Datei wählen oder hineinziehen, dann importieren */
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  const { t } = useI18n();
  const { showSuccess, handleError } = useNotification();

  const selectedFile = ref<File | null>(null);
  const isImporting = ref(false);
  const importResult = ref<{ success: boolean; message: string } | null>(null);

  function selectFile(file: File) {
    selectedFile.value = file;
    importResult.value = null;
  }

  async function submitImport() {
    if (!selectedFile.value) return;
    isImporting.value = true;
    importResult.value = null;

    try {
      const formData = new FormData();
      formData.append("file", selectedFile.value);

      const endpoint = selectedFile.value.name.endsWith(".xlsx") ? "xlsx" : "csv";
      const response = await fetch(`${apiBaseUrl}/import/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        importResult.value = { success: true, message: t("settings.import.success") };
        showSuccess(t("settings.import.successToast"));
        selectedFile.value = null;
        await reloadAllData();
      } else if (response.status === 400 || response.status === 422) {
        const data: { message?: unknown } | null = await response.json().catch(() => null);
        const serverMessage = typeof data?.message === "string" ? data.message : "";
        importResult.value = {
          success: false,
          message:
            serverMessage !== ""
              ? serverMessage
              : t("settings.import.importError", { status: response.statusText }),
        };
      } else {
        importResult.value = {
          success: false,
          message: t("settings.import.serverError", { status: response.status }),
        };
      }
    } catch (error) {
      handleError(error as Error, t("settings.import.failedToast"));
      importResult.value = { success: false, message: t("settings.import.networkError") };
    } finally {
      isImporting.value = false;
    }
  }
</script>
