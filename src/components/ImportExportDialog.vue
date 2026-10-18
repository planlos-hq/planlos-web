<template>
  <b-modal
    :show="modelValue"
    title="Import / Export"
    size="md"
    scrollable
    no-animation
    @hide="emit('update:modelValue', false)"
    @show="onShown"
  >
    <!-- Tab switcher -->
    <div class="d-flex flex-row mb-4 gap-2">
      <b-button
        :variant="activeMode === 'import' ? 'primary' : 'outline-primary'"
        class="flex-grow-1"
        @click="activeMode = 'import'"
      >
        <upload :size="16" class="me-1" /> Import
      </b-button>
      <b-button
        :variant="activeMode === 'export' ? 'primary' : 'outline-primary'"
        class="flex-grow-1"
        @click="activeMode = 'export'"
      >
        <download :size="16" class="me-1" /> Export
      </b-button>
    </div>

    <!-- IMPORT -->
    <div v-if="activeMode === 'import'">
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

      <b-alert
        v-if="importResult"
        :variant="importResult.success ? 'success' : 'danger'"
        class="mt-3 mb-0"
        dismissible
        @dismissed="importResult = null"
      >
        {{ importResult.message }}
      </b-alert>
    </div>

    <!-- EXPORT -->
    <div v-if="activeMode === 'export'">
      <p class="text-muted small mb-3">Wähle eine Ressource und das Format für den Download aus.</p>

      <div class="d-flex flex-column gap-3">
        <div v-for="resource in exportResources" :key="resource.key" class="export-item">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="fw-semibold">{{ resource.label }}</span>
            <b-spinner v-if="loadingExport === resource.key" small />
          </div>
          <div class="d-flex gap-2">
            <b-button
              variant="outline-secondary"
              size="sm"
              class="flex-grow-1"
              :disabled="!!loadingExport"
              @click="exportData(resource.key, 'csv')"
            >
              <download :size="14" class="me-1" /> CSV
            </b-button>
            <b-button
              variant="outline-secondary"
              size="sm"
              class="flex-grow-1"
              :disabled="!!loadingExport"
              @click="exportData(resource.key, 'xlsx')"
            >
              <download :size="14" class="me-1" /> Excel
            </b-button>
          </div>
        </div>
      </div>

      <b-alert
        v-if="exportError"
        variant="danger"
        class="mt-3 mb-0"
        dismissible
        @dismissed="exportError = null"
      >
        {{ exportError }}
      </b-alert>
    </div>

    <template #footer="{ cancel }">
      <b-button @click="cancel()" variant="secondary">Schließen</b-button>
      <b-button
        v-if="activeMode === 'import'"
        variant="primary"
        :disabled="!selectedFile || isImporting"
        @click="submitImport"
      >
        <b-spinner v-if="isImporting" small class="me-1" />
        {{ isImporting ? "Wird importiert…" : "Importieren" }}
      </b-button>
    </template>
  </b-modal>
</template>

<script setup lang="ts">
  import { ref, useTemplateRef } from "vue";
  import { BModal, BButton, BAlert, BSpinner } from "bootstrap-vue-next";
  import { Upload, Download, FileText } from "lucide-vue-next";
  import { useNotification } from "@/composables/useNotification";
  import { getAllApplicationData } from "@/api/globalGalactic";
  import { useResourceConflictStore } from "@/stores/resourceConflictsStore";

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  const { showSuccess, handleError } = useNotification();

  defineProps<{
    modelValue: boolean;
  }>();

  const emit = defineEmits<{
    "update:modelValue": [value: boolean];
  }>();

  const fileInput = useTemplateRef<HTMLInputElement>("fileInput");

  const activeMode = ref<"import" | "export">("import");
  const isDragging = ref(false);
  const selectedFile = ref<File | null>(null);
  const isImporting = ref(false);
  const importResult = ref<{ success: boolean; message: string } | null>(null);
  const loadingExport = ref<string | null>(null);
  const exportError = ref<string | null>(null);

  const exportResources = [
    { key: "lecturer", label: "Lehrpersonen" },
    { key: "room", label: "Räume" },
    { key: "degree_program", label: "Studiengänge" },
    { key: "study_group", label: "Semestergruppen" },
    { key: "course", label: "Veranstaltungen" },
  ];

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function onShown() {
    selectedFile.value = null;
    importResult.value = null;
    exportError.value = null;
    isDragging.value = false;
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
        await getAllApplicationData();
        const conflictStore = useResourceConflictStore();
        await conflictStore.loadResourceConflicts();
        await conflictStore.loadIgnoredResourceConflicts();
      } else if (response.status === 400 || response.status === 422) {
        const data = await response.json().catch(() => null);
        importResult.value = {
          success: false,
          message: data?.message || `Fehler beim Import (${response.statusText})`,
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

  async function exportData(resource: string, format: "csv" | "xlsx") {
    loadingExport.value = resource;
    exportError.value = null;

    try {
      const response = await fetch(`${apiBaseUrl}/export/${format}/${resource}`);

      if (!response.ok) {
        exportError.value = `Export fehlgeschlagen (${response.status}).`;
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      const serverFilename = filenameMatch?.[1];

      const resourceLabel = exportResources.find(r => r.key === resource)?.label ?? resource;
      const extension = format === "xlsx" ? "xlsx" : "csv";

      // Use server filename ONLY if it's not the generic 'export.csv' or 'export.xlsx'
      const genericFilename = `export.${extension}`;
      const filename =
        serverFilename !== undefined &&
        serverFilename !== null &&
        serverFilename !== genericFilename
          ? serverFilename
          : `${resourceLabel}.${extension}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      handleError(error as Error, "Export fehlgeschlagen.");
      exportError.value = "Netzwerkfehler beim Export.";
    } finally {
      loadingExport.value = null;
    }
  }
</script>

<style scoped>
  .drop-zone {
    border: 2px dashed var(--bs-border-color);
    border-radius: 0.5rem;
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition:
      border-color 0.2s,
      background-color 0.2s;
    text-align: center;
  }

  .drop-zone:hover,
  .drop-zone--over {
    border-color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.05);
  }

  .drop-zone--selected {
    border-color: var(--bs-success);
    background-color: rgba(var(--bs-success-rgb), 0.05);
  }

  .export-item {
    padding: 0.75rem;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    transition: background-color 0.2s;
  }

  .export-item:hover {
    background-color: var(--bs-light);
  }
</style>
