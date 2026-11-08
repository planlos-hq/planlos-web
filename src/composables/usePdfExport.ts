import { computed, ref } from "vue";
import { useViewStore } from "@/stores/viewStore";
import { Tab } from "@/enums/enums";

/**
 * PDF der aktuellen Planungsansicht (Kalender als Bild).
 *
 * @returns exportToPdf, exporting (läuft gerade) und exportError (Fehlermeldung)
 */
export function usePdfExport() {
  const viewStore = useViewStore();
  const exporting = ref(false);
  const exportError = ref<string | null>(null);

  const pdfFilename = computed(() => {
    const tabLabel: Record<string, string> = {
      [Tab.COURSE]: "stundenplan-kurse",
      [Tab.LECTURER]: "stundenplan-dozenten",
      [Tab.STUDYGROUP]: "stundenplan-studiengruppe",
      [Tab.ROOM]: "stundenplan-raeume",
    };
    return tabLabel[viewStore.view.tab] ?? "stundenplan";
  });

  async function exportToPdf() {
    const calendarEl = document.querySelector(".vuecal") as HTMLElement | null;
    if (!calendarEl) {
      exportError.value = "Kalender nicht gefunden.";
      return;
    }
    exporting.value = true;
    exportError.value = null;

    try {
      // Erst beim Export laden: die Bibliotheken sind groß und werden selten gebraucht
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
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

            /* html2canvas rendert den inset box-shadow der Zellen fehlerhaft als graue Fläche */
            .vuecal__cell {
              box-shadow: none !important;
            }

            .vuecal__weekday,
            .vuecal__weekday-day {
              overflow: visible !important;
              text-overflow: clip !important;
              max-width: none !important;
            }

            /* UI-Overlays ausblenden die ins Bild lecken */
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

  return { exportToPdf, exporting, exportError };
}
