<template>
  <b-modal
    title="Planungsansicht teilen"
    size="md"
    scrollable
    no-footer
    lazy
    unmount-lazy
    style="min-height: 1000px"
  >
    <b-input-group size="md" class="m-0">
      <b-form-input class="flex-grow-1" v-model="url" />
      <template #append>
        <b-button variant="primary" @click="copyToClipboard">
          <clipboard :size="24" />
        </b-button>
      </template>
    </b-input-group>
    <div class="feedback">
      <small v-if="copied" class="text-success mt-2 d-block"> Link kopiert! </small>
    </div>

    <hr />

    <b-button variant="outline-secondary" class="w-100" :disabled="exporting" @click="exportToPdf">
      <file-down :size="20" class="me-2" />
      {{ exporting ? "Wird exportiert..." : "Als PDF exportieren" }}
    </b-button>
    <small v-if="exportError" class="text-danger mt-2 d-block">{{ exportError }}</small>
  </b-modal>
</template>

<script setup lang="ts">
  import { BModal, BInputGroup, BFormInput, BButton } from "bootstrap-vue-next";
  import { computed, ref } from "vue";
  import { Clipboard, FileDown } from "lucide-vue-next";
  import { useViewStore } from "@/stores/viewStore";
  import { usePdfExport } from "@/composables/usePdfExport";

  const viewStore = useViewStore();

  const url = computed(() => viewStore.shareUrl);

  const copied = ref(false);
  const { exportToPdf, exporting, exportError } = usePdfExport();

  async function copyToClipboard() {
    await navigator.clipboard.writeText(url.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1000);
  }
</script>

<style scoped lang="css">
  .feedback {
    min-height: 40px;
  }
</style>
