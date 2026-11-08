<template>
  <b-modal
    :show="modelValue"
    title="Einstellungen"
    size="xl"
    scrollable
    no-animation
    no-footer
    body-class="p-0"
    @hide="emit('update:modelValue', false)"
  >
    <div class="settings">
      <nav class="settings-nav" aria-label="Bereiche der Einstellungen">
        <!-- Wie die Suchleiste der Listen (SearchBar.vue), mit Enter und Sprung zum ersten Treffer -->
        <b-input-group class="mb-2">
          <b-form-input
            v-model="query"
            type="search"
            placeholder="Suche..."
            aria-label="Einstellungen durchsuchen, z. B. Wochentage, PDF oder Import"
            @keydown.enter.prevent="jumpToFirst"
          />
          <template #append>
            <b-button variant="primary" aria-label="Zum ersten Treffer" @click="jumpToFirst">
              <search-icon :size="20" aria-hidden="true" />
            </b-button>
          </template>
        </b-input-group>

        <!-- Beim Suchen stehen hier einzelne Einstellungen; ein Klick springt direkt hin -->
        <template v-if="query.trim() !== ''">
          <p class="cap">Treffer</p>
          <button v-for="r in results" :key="r.id" type="button" class="result" @click="jump(r)">
            <span>{{ r.label }}</span>
            <small>{{ sectionTitle(r.section) }}</small>
          </button>
          <p v-if="results.length === 0" class="empty">Keine Treffer für „{{ query }}“</p>
        </template>

        <template v-else>
          <p class="cap">Allgemein</p>
          <button
            v-for="s in sections"
            :key="s.id"
            type="button"
            :class="{ active: s.id === current.id }"
            :aria-current="s.id === current.id ? 'page' : undefined"
            @click="emit('update:section', s.id)"
          >
            <component :is="s.icon" :size="16" aria-hidden="true" />
            {{ s.title }}
          </button>
        </template>
      </nav>

      <div ref="content" class="settings-content">
        <header>
          <h2>{{ current.title }}</h2>
        </header>
        <p class="text-muted">{{ current.description }}</p>

        <view-panel v-if="current.id === 'view'" />

        <template v-else>
          <section class="block" data-setting="import">
            <h3>Importieren</h3>
            <data-import />
          </section>
          <section class="block">
            <h3>Exportieren</h3>
            <export-center :open="openExport" />
          </section>
        </template>
      </div>
    </div>
  </b-modal>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, useTemplateRef, type Component } from "vue";
  import { BButton, BFormInput, BInputGroup, BModal } from "bootstrap-vue-next";
  import { Database, LayoutGrid, Search as SearchIcon } from "lucide-vue-next";
  import DataImport from "./DataImport.vue";
  import ExportCenter from "./ExportCenter.vue";
  import ViewPanel from "./ViewPanel.vue";

  /** Einstellungen mit Navigation und Suche: Ansicht sowie Daten (Import und Export) */
  const props = defineProps<{
    modelValue: boolean;
    /** Offener Bereich: "view" oder "data" */
    section?: string;
  }>();

  const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    "update:section": [value: string];
  }>();

  type Section = { id: string; title: string; description: string; icon: Component };

  const sections: Section[] = [
    {
      id: "view",
      title: "Ansicht",
      description: "Wochentage, Pausen und Semestergruppen der Planungsansicht.",
      icon: LayoutGrid,
    },
    {
      id: "data",
      title: "Daten",
      description: "Ressourcen importieren sowie den Stundenplan und Tabellen exportieren.",
      icon: Database,
    },
  ];

  const current = computed(() => sections.find(s => s.id === props.section) ?? sections[0]!);

  const sectionTitle = (id: string) => sections.find(s => s.id === id)?.title ?? "";

  // --- Suche über einzelne Einstellungen ---

  /** Eine Einstellung, die die Suche findet; target ist ihr data-setting-Attribut */
  type Entry = {
    id: string;
    section: string;
    label: string;
    /** Weitere Wörter, unter denen sie gefunden wird */
    terms: string;
    target: string;
    /** Eintrag der Exportliste, der aufgeklappt wird */
    exportKey?: string;
  };

  const entries: Entry[] = [
    { id: "view", section: "view", label: "Ansicht", terms: "anzeige", target: "" },
    {
      id: "weekdays",
      section: "view",
      label: "Wochentage",
      terms:
        "tage montag dienstag mittwoch donnerstag freitag samstag sonntag wochenende ausblenden",
      target: "weekdays",
    },
    {
      id: "breaks",
      section: "view",
      label: "Pausenzeiten anzeigen",
      terms: "pause pausen mittag mittagspause",
      target: "breaks",
    },
    {
      id: "groups",
      section: "view",
      label: "Semestergruppen",
      terms: "gruppen kohorte jahrgang studiengang auswahl filter sortieren",
      target: "groups",
    },
    { id: "data", section: "data", label: "Daten", terms: "import export", target: "" },
    {
      id: "import",
      section: "data",
      label: "Daten importieren",
      terms: "import csv excel xlsx hochladen upload datei",
      target: "import",
    },
    {
      id: "export-pdf",
      section: "data",
      label: "Stundenplan als PDF exportieren",
      terms: "pdf drucken aushang export",
      target: "export:pdf",
      exportKey: "pdf",
    },
    {
      id: "export-tables",
      section: "data",
      label: "Tabellen exportieren (CSV / Excel)",
      terms:
        "csv excel xlsx tabelle export herunterladen lehrpersonen räume studiengänge semestergruppen veranstaltungen",
      target: "export:tables",
      exportKey: "tables",
    },
  ];

  const query = ref("");

  /** Ohne Unterschied bei Groß-/Kleinschreibung und Umlauten */
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  /** Jedes Wort muss vorkommen; Treffer im Namen stehen oben */
  const results = computed(() => {
    const words = normalize(query.value).split(/\s+/).filter(Boolean);
    return entries
      .map(e => {
        const label = normalize(e.label);
        const text = `${label} ${normalize(`${e.terms} ${sectionTitle(e.section)}`)}`;
        if (!words.every(w => text.includes(w))) {
          return undefined;
        }
        const score = words.reduce(
          (sum, w) =>
            sum + (label.startsWith(w) ? 3 : label.split(/\s+/).some(t => t.startsWith(w)) ? 2 : 0),
          0
        );
        return { entry: e, score };
      })
      .filter((r): r is { entry: Entry; score: number } => r !== undefined)
      .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
      .map(r => r.entry);
  });

  function jumpToFirst() {
    const first = results.value[0];
    if (first !== undefined) {
      void jump(first);
    }
  }

  const content = useTemplateRef<HTMLDivElement>("content");
  const openExport = ref<string | null>(null);

  /** Öffnet den Bereich eines Treffers, scrollt zur Einstellung und hebt sie kurz hervor */
  async function jump(entry: Entry) {
    emit("update:section", entry.section);
    query.value = "";
    openExport.value = null;
    await nextTick();
    if (entry.exportKey !== undefined) {
      openExport.value = entry.exportKey;
      await nextTick();
    }
    if (entry.target === "") {
      return;
    }
    const el = content.value?.querySelector<HTMLElement>(`[data-setting="${entry.target}"]`);
    if (!el) {
      return;
    }
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
    el.querySelector<HTMLElement>("input, select, button")?.focus({ preventScroll: true });
    el.classList.remove("flash");
    void el.offsetWidth; // Animation neu starten
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1600);
  }
</script>

<style scoped>
  .settings {
    display: grid;
    grid-template-columns: 15rem minmax(0, 1fr);
    min-height: 32rem;
  }

  .settings-nav {
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.85rem;
  }

  .cap {
    color: var(--bs-secondary-color);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    margin: 0.7rem 0.5rem 0.2rem;
    text-transform: uppercase;
  }

  .settings-nav > button {
    align-items: center;
    background: none;
    border: none;
    border-radius: 0.375rem;
    color: inherit;
    display: flex;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    text-align: left;
  }

  .settings-nav > button:hover {
    background: var(--hover-color);
  }

  .settings-nav > button.active {
    background: var(--seleted-item-color);
    color: var(--button-color);
    font-weight: 600;
  }

  .settings-nav .result {
    align-items: flex-start;
    flex-direction: column;
    gap: 0;
  }

  .result small {
    color: var(--bs-secondary-color);
    font-size: 0.75rem;
  }

  .empty {
    color: var(--bs-secondary-color);
    font-size: 0.85rem;
    margin: 0.5rem;
  }

  .settings-content {
    min-width: 0;
    padding: 1.25rem 1.5rem;
  }

  h2 {
    font-size: 1.25rem;
    margin: 0;
  }

  h3 {
    font-size: 1rem;
    font-weight: 600;
  }

  .block {
    border-top: 1px solid var(--border-color);
    margin-top: 1rem;
    padding-top: 1rem;
  }

  /* Von der Suche gefundene Einstellung */
  .settings-content :deep([data-setting].flash) {
    animation: flash 1.6s ease-out;
    border-radius: 0.5rem;
  }

  @keyframes flash {
    0%,
    40% {
      background-color: color-mix(in srgb, var(--seleted-item-color) 35%, transparent);
      box-shadow: 0 0 0 4px var(--seleted-item-color);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .settings-content :deep([data-setting].flash) {
      animation: none;
      outline: 2px solid var(--button-color);
    }
  }

  @media (width <= 720px) {
    .settings {
      grid-template-columns: 1fr;
    }

    .settings-nav {
      border-bottom: 1px solid var(--border-color);
      border-right: none;
    }
  }
</style>
