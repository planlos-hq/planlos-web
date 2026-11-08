<template>
  <div>
    <p class="text-muted small mb-3">
      Lade eine CSV- oder Excel-Datei (.xlsx) hoch. Der Typ wird anhand der Kopfzeile automatisch
      erkannt.
    </p>

    <div
      class="drop-zone"
      :class="{ 'drop-zone--over': isDragging, 'drop-zone--selected': selectedFile }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <template v-if="!selectedFile">
        <upload :size="32" class="mb-2 text-muted" />
        <span class="text-muted">Datei hierher ziehen oder klicken zum Auswählen</span>
      </template>
      <template v-else>
        <file-text :size="32" class="mb-2 text-success" />
        <span class="fw-semibold">{{ selectedFile.name }}</span>
        <span class="text-muted small">{{ formatFileSize(selectedFile.size) }}</span>
      </template>
      <input
        ref="fileInput"
        type="file"
        accept=".csv,.xlsx"
        style="display: none"
        @change="onFileSelected"
      />
    </div>

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
  import { ref, useTemplateRef } from "vue";
  import { BAlert, BButton, BSpinner } from "bootstrap-vue-next";
  import { FileText, Upload } from "lucide-vue-next";
  import { useNotification } from "@/composables/useNotification";
  import { getAllApplicationData } from "@/api/globalGalactic";
  import { pruneView } from "@/router/pruneView";
  import { useResourceConflictStore } from "@/stores/resourceConflictsStore";

  /** CSV/Excel-Import: Datei wählen oder hineinziehen, dann importieren */
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  const { showSuccess, handleError } = useNotification();

  const fileInput = useTemplateRef<HTMLInputElement>("fileInput");

  const isDragging = ref(false);
  const selectedFile = ref<File | null>(null);
  const isImporting = ref(false);
  const importResult = ref<{ success: boolean; message: string } | null>(null);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function isAllowedFile(file: File): boolean {
    return file.name.endsWith(".csv") || file.name.endsWith(".xlsx");
  }

  function onDrop(event: DragEvent) {
    isDragging.value = false;
    const file = event.dataTransfer?.files[0];
    if (file && isAllowedFile(file)) {
      selectedFile.value = file;
      importResult.value = null;
    }
  }

  function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && isAllowedFile(file)) {
      selectedFile.value = file;
      importResult.value = null;
    }
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
        if (await getAllApplicationData()) await pruneView();
        const conflictStore = useResourceConflictStore();
        await conflictStore.loadResourceConflicts();
        await conflictStore.loadIgnoredResourceConflicts();
        await conflictStore.loadCourseLecturerViolations();
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

<style scoped>
  .drop-zone {
    align-items: center;
    border: 2px dashed var(--bs-border-color);
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 2rem 1rem;
    text-align: center;
    transition:
      border-color 0.2s,
      background-color 0.2s;
  }

  .drop-zone:hover,
  .drop-zone--over {
    background-color: color-mix(in srgb, var(--button-color) 5%, transparent);
    border-color: var(--button-color);
  }

  .drop-zone--selected {
    background-color: rgb(var(--bs-success-rgb), 0.05);
    border-color: var(--bs-success);
  }
</style>
