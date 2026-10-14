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
  import { useQueryParameters } from "@/composables/useQueryParameters";
  import { Clipboard, FileDown } from "lucide-vue-next";
  import { useSettingsStore } from "@/stores/settingsStore";
  import { Tab } from "@/enums/enums";
  import html2canvas from "html2canvas-pro";
  import jsPDF from "jspdf";

  const params = useQueryParameters();
  const store = useSettingsStore();

  const url = computed(() => params.getShareableUrl(store.plannerSettings));

  const pdfFilename = computed(() => {
    const tab = store.plannerSettings.tab;
    const tabLabel: Record<string, string> = {
      [Tab.COURSE]: "stundenplan-kurse",
      [Tab.LECTURER]: "stundenplan-dozenten",
      [Tab.STUDYGROUP]: "stundenplan-studiengruppe",
      [Tab.ROOM]: "stundenplan-raeume",
    };
    return tabLabel[tab] ?? "stundenplan";
  });

  const copied = ref(false);
  const exporting = ref(false);
  const exportError = ref<string | null>(null);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(url.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1000);
  }
  async function exportToPdf() {
    const calendarEl = document.querySelector(".vuecal") as HTMLElement | null;
    if (!calendarEl) {
      exportError.value = "Kalender nicht gefunden.";
      return;
    }
    exporting.value = true;
    exportError.value = null;

    try {
      const scale = 2;
      const scrollableEl = calendarEl.querySelector(".vuecal__scrollable") as HTMLElement | null;
      const fullScrollHeight = scrollableEl?.scrollHeight ?? calendarEl.scrollHeight;

      const canvas = await html2canvas(calendarEl, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: clonedDoc => {
          const style = clonedDoc.createElement("style");
          style.textContent = `
            .vuecal__weekday--today,
            .vuecal__cell--today,
            .vuecal__cell--current,
            .vuecal__weekday--current,
            .vuecal__no-event--today {
              background-color: transparent !important;
              background-image: none !important;
              color: inherit !important;
            }

            .vuecal,
            .vuecal__body-wrap,
            .vuecal__scrollable-wrap {
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
            }
            .vuecal__scrollable {
              height: ${fullScrollHeight}px !important;
              max-height: none !important;
              overflow: visible !important;
            }

            .vuecal__weekday,
            .vuecal__weekday-day {
              overflow: visible !important;
              text-overflow: clip !important;
              max-width: none !important;
            }

            /* UI-Overlays ausblenden, die sonst ins Bild lecken */
            .side-bar, .modal-backdrop, .offcanvas-backdrop, .info-btn-container, .toast-container {
              display: none !important;
            }

            body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pageWidth = canvas.width / scale;
      const pageHeight = canvas.height / scale;
      const pdf = new jsPDF({
        orientation: pageWidth >= pageHeight ? "landscape" : "portrait",
        unit: "px",
        format: [pageWidth, pageHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`${pdfFilename.value}.pdf`);
    } catch (e) {
      exportError.value = "Export fehlgeschlagen. Bitte versuche es erneut.";
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      exporting.value = false;
    }
  }
</script>

<style scoped lang="css">
  .feedback {
    min-height: 40px;
  }
</style>
