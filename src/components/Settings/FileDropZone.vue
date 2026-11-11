<template>
  <div
    class="drop-zone"
    :class="{ 'drop-zone--over': isDragging, 'drop-zone--selected': modelValue }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="fileInput?.click()"
  >
    <template v-if="!modelValue">
      <upload :size="32" class="mb-2 text-muted" />
      <span class="text-muted">Datei hierher ziehen oder klicken zum Auswählen</span>
    </template>
    <template v-else>
      <file-text :size="32" class="mb-2 text-success" />
      <span class="fw-semibold">{{ modelValue.name }}</span>
      <span class="text-muted small">{{ formatFileSize(modelValue.size) }}</span>
    </template>
    <input
      ref="fileInput"
      type="file"
      :accept="accept.join(',')"
      style="display: none"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, useTemplateRef } from "vue";
  import { FileText, Upload } from "lucide-vue-next";

  /** Feld zum Hineinziehen oder Auswählen einer Datei */
  const props = defineProps<{
    /** Gewählte Datei */
    modelValue: File | null;
    /** Erlaubte Dateiendungen, z. B. [".csv", ".xlsx"] */
    accept: string[];
  }>();

  const emit = defineEmits<{
    "update:modelValue": [file: File];
  }>();

  const fileInput = useTemplateRef<HTMLInputElement>("fileInput");
  const isDragging = ref(false);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function choose(file: File | undefined) {
    if (file && props.accept.some(ext => file.name.toLowerCase().endsWith(ext))) {
      emit("update:modelValue", file);
    }
  }

  function onDrop(event: DragEvent) {
    isDragging.value = false;
    choose(event.dataTransfer?.files[0]);
  }

  function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    choose(input.files?.[0]);
    input.value = ""; // dieselbe Datei erneut wählbar
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
