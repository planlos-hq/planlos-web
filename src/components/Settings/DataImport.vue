<template>
  <div>
    <p class="text-muted small mb-3">
      Lade eine CSV- oder Excel-Datei (.xlsx) hoch. Der Typ wird anhand der Kopfzeile automatisch
      erkannt.
    </p>

    <file-drop-zone
      :model-value="selectedFile"
      :accept="['.csv', '.xlsx']"
      @update:model-value="selectFile"
    />

    <div class="d-flex justify-content-end mt-3">
      <b-button variant="primary" :disabled="!selectedFile || isImporting" @click="submitImport">
        <b-spinner v-if="isImporting" small class="me-1" />
        {{ isImporting ? "Wird importiert…" : "Importieren" }}
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
  import { BAlert, BButton, BSpinner } from "bootstrap-vue-next";
  import FileDropZone from "./FileDropZone.vue";
  import { useNotification } from "@/composables/useNotification";
  import { reloadAllData } from "@/api/globalGalactic";

  /** CSV/Excel-Import: Datei wählen oder hineinziehen, dann importieren */
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

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
        importResult.value = { success: true, message: "Import erfolgreich abgeschlossen." };
        showSuccess("Daten erfolgreich importiert!");
        selectedFile.value = null;
        await reloadAllData();
      } else if (response.status === 400 || response.status === 422) {
        const data: { message?: unknown } | null = await response.json().catch(() => null);
        const serverMessage = typeof data?.message === "string" ? data.message : "";
        importResult.value = {
          success: false,
          message:
            serverMessage !== "" ? serverMessage : `Fehler beim Import (${response.statusText})`,
        };
      } else {
        importResult.value = {
          success: false,
          message: `Serverfehler (${response.status}). Bitte erneut versuchen.`,
        };
      }
    } catch (error) {
      handleError(error as Error, "Import fehlgeschlagen.");
      importResult.value = { success: false, message: "Netzwerkfehler beim Import." };
    } finally {
      isImporting.value = false;
    }
  }
</script>
