<template>
  <div class="export-center">
    <template v-for="group in groups" :key="group.key">
      <p class="cap">{{ t(`settings.export.groups.${group.key}`) }}</p>
      <div
        v-for="e in group.entries"
        :key="e.key"
        class="entry"
        :class="{ open: openKey === e.key }"
        :data-setting="`export:${e.key}`"
      >
        <button
          type="button"
          class="entry-head"
          :aria-expanded="openKey === e.key"
          :aria-controls="`export-${e.key}`"
          @click="openKey = openKey === e.key ? null : e.key"
        >
          <span class="icon"><component :is="e.icon" :size="20" aria-hidden="true" /></span>
          <span class="text">
            <span class="title">{{ t(e.labelKey) }}</span>
            <span class="desc">{{ t(e.descriptionKey) }}</span>
          </span>
          <chevron-down class="chev" :size="18" aria-hidden="true" />
        </button>

        <div v-if="openKey === e.key" :id="`export-${e.key}`" class="entry-body">
          <div v-for="o in e.options" :key="o.name" class="option">
            <label :for="`${e.key}-${o.name}`">{{ t(o.labelKey) }}</label>
            <b-form-select
              v-if="o.choices.length > 3"
              :id="`${e.key}-${o.name}`"
              :model-value="valueOf(e, o.name)"
              :options="o.choices.map(c => ({ value: c.value, text: t(c.labelKey) }))"
              size="sm"
              @update:model-value="v => setValue(e, o.name, v)"
            />
            <div
              v-else
              :id="`${e.key}-${o.name}`"
              class="segmented"
              role="radiogroup"
              :aria-label="t(o.labelKey)"
            >
              <button
                v-for="c in o.choices"
                :key="c.value"
                type="button"
                role="radio"
                :aria-checked="valueOf(e, o.name) === c.value"
                :class="{ active: valueOf(e, o.name) === c.value }"
                @click="setValue(e, o.name, c.value)"
              >
                {{ t(c.labelKey) }}
              </button>
            </div>
          </div>

          <b-button
            variant="primary"
            size="sm"
            class="download"
            :disabled="busy !== null"
            @click="runExport(e)"
          >
            <b-spinner v-if="busy === e.key" small class="me-1" />
            <download v-else :size="16" class="me-1" />
            {{ t("common.download") }}
          </b-button>
          <b-alert
            v-if="error?.key === e.key"
            variant="danger"
            class="mt-2 mb-0 small"
            :model-value="true"
            dismissible
            @dismissed="error = null"
          >
            {{ error.text }}
          </b-alert>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref, watch, type Component } from "vue";
  import { useI18n } from "vue-i18n";
  import { BAlert, BButton, BFormSelect, BSpinner } from "bootstrap-vue-next";
  import { ChevronDown, Download, FileDown, Sheet } from "lucide-vue-next";
  import { usePdfExport } from "@/composables/usePdfExport";
  import { responseFilename, saveBlob } from "@/api/download";

  /**
   * Alle Exporte in einer Liste: Stundenplan als PDF und Tabellen (CSV / Excel).
   * Jeder Eintrag klappt auf, zeigt seine Optionen und einen Herunterladen-Knopf.
   */
  const props = defineProps<{
    /** Eintrag, der aufgeklappt werden soll, z. B. "pdf" oder "tables" */
    open?: string | null;
  }>();

  /** Eine feste Auswahl, bis 3 Werte als Umschalter, sonst als Liste */
  type ExportOption = {
    name: string;
    labelKey: string;
    choices: { value: string; labelKey: string }[];
    default: string;
  };

  type Values = Record<string, string>;

  type Entry = {
    key: string;
    group: "view" | "data";
    labelKey: string;
    descriptionKey: string;
    icon: Component;
    options: ExportOption[];
    /** Lädt herunter; gibt eine Fehlermeldung zurück oder undefined */
    run: (values: Values) => Promise<string | undefined>;
  };

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
  const { t } = useI18n();
  const { exportToPdf, exportError } = usePdfExport();

  const tableResources = [
    { value: "lecturer", labelKey: "settings.export.resources.lecturer" },
    { value: "room", labelKey: "settings.export.resources.room" },
    { value: "degree_program", labelKey: "settings.export.resources.degreeProgram" },
    { value: "study_group", labelKey: "settings.export.resources.studyGroup" },
    { value: "course", labelKey: "settings.export.resources.course" },
  ];

  const entries: Entry[] = [
    {
      key: "pdf",
      group: "view",
      labelKey: "settings.export.entries.pdf.label",
      descriptionKey: "settings.export.entries.pdf.description",
      icon: FileDown,
      options: [],
      run: async () => {
        await exportToPdf();
        return exportError.value ?? undefined;
      },
    },
    {
      key: "tables",
      group: "data",
      labelKey: "settings.export.entries.tables.label",
      descriptionKey: "settings.export.entries.tables.description",
      icon: Sheet,
      options: [
        {
          name: "resource",
          labelKey: "settings.export.options.resource",
          choices: tableResources,
          default: "lecturer",
        },
        {
          name: "format",
          labelKey: "settings.export.options.format",
          choices: [
            { value: "xlsx", labelKey: "settings.export.formats.xlsx" },
            { value: "csv", labelKey: "settings.export.formats.csv" },
          ],
          default: "xlsx",
        },
      ],
      run: async values => {
        const resource = values.resource ?? "lecturer";
        const format = values.format ?? "xlsx";
        const response = await fetch(`${apiBaseUrl}/export/${format}/${resource}`);
        if (!response.ok) {
          return t("settings.export.serverError", { status: response.status });
        }
        // Der Server nennt jede Datei export.<format>, besser nach der Ressource benennen
        const name = responseFilename(response);
        const resourceKey = tableResources.find(r => r.value === resource)?.labelKey;
        const label = resourceKey !== undefined ? t(resourceKey) : resource;
        saveBlob(
          await response.blob(),
          name !== undefined && name !== `export.${format}` ? name : `${label}.${format}`
        );
        return undefined;
      },
    },
  ];

  const groups = (["view", "data"] as const).map(key => ({
    key,
    entries: entries.filter(e => e.group === key),
  }));

  const openKey = ref<string | null>(null);
  watch(
    () => props.open,
    key => {
      if (typeof key === "string" && key !== "") {
        openKey.value = key;
      }
    },
    { immediate: true }
  );

  const busy = ref<string | null>(null);
  const error = ref<{ key: string; text: string } | null>(null);

  const values = reactive<Record<string, Values>>(
    Object.fromEntries(
      entries.map(e => [e.key, Object.fromEntries(e.options.map(o => [o.name, o.default]))])
    )
  );

  function valueOf(e: Entry, name: string) {
    return values[e.key]?.[name] ?? null;
  }

  function setValue(e: Entry, name: string, value: unknown) {
    if (typeof value === "string") {
      values[e.key] = { ...values[e.key], [name]: value };
    }
  }

  async function runExport(e: Entry) {
    busy.value = e.key;
    error.value = null;
    try {
      const message = await e.run(values[e.key] ?? {});
      if (message !== undefined) {
        error.value = { key: e.key, text: message };
      }
    } catch {
      error.value = { key: e.key, text: t("settings.export.networkError") };
    } finally {
      busy.value = null;
    }
  }
</script>

<style scoped>
  .export-center {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cap {
    color: var(--bs-secondary-color);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    margin: 0.5rem 0 0;
    text-transform: uppercase;
  }

  .cap:first-child {
    margin-top: 0;
  }

  .entry {
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
  }

  .entry.open {
    border-color: var(--button-color);
  }

  .entry-head {
    align-items: center;
    background: none;
    border: none;
    border-radius: 0.5rem;
    color: inherit;
    display: flex;
    gap: 0.75rem;
    padding: 0.7rem 0.85rem;
    text-align: left;
    width: 100%;
  }

  .entry-head:hover {
    background: var(--bs-tertiary-bg);
  }

  .entry-head:focus-visible {
    outline: 2px solid var(--button-color);
    outline-offset: -2px;
  }

  .icon {
    align-items: center;
    background: var(--seleted-item-color);
    border-radius: 0.5rem;
    color: var(--button-color);
    display: flex;
    flex-shrink: 0;
    height: 2.25rem;
    justify-content: center;
    width: 2.25rem;
  }

  .text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  .title {
    font-weight: 600;
  }

  .desc {
    color: var(--bs-secondary-color);
    font-size: 0.85rem;
  }

  .entry:not(.open) .desc {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chev {
    color: var(--bs-secondary-color);
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .entry.open .chev {
    transform: rotate(180deg);
  }

  .entry-body {
    border-top: 1px solid var(--bs-border-color);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.85rem;
  }

  .option {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .option label {
    font-size: 0.85rem;
    font-weight: 500;
  }

  .segmented {
    background: var(--bs-tertiary-bg);
    border-radius: 0.5rem;
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    padding: 0.2rem;
    width: fit-content;
  }

  .segmented button {
    background: none;
    border: none;
    border-radius: 0.375rem;
    color: var(--bs-secondary-color);
    font-size: 0.875rem;
    padding: 0.25rem 0.75rem;
  }

  .segmented button.active {
    background: var(--bs-body-bg);
    box-shadow: 0 1px 2px rgb(0 0 0 / 12%);
    color: var(--button-color);
    font-weight: 600;
  }

  .segmented button:focus-visible {
    outline: 2px solid var(--button-color);
  }

  .download {
    align-items: center;
    align-self: flex-start;
    display: inline-flex;
  }

  @media (prefers-reduced-motion: reduce) {
    .chev {
      transition: none;
    }
  }
</style>
