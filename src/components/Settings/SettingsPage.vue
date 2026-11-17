<template>
  <b-modal
    :show="modelValue"
    :title="t('settings.page.title')"
    size="xl"
    scrollable
    no-footer
    body-class="p-0"
    @hide="emit('update:modelValue', false)"
    @shown="onShown"
    @hidden="isShown = false"
  >
    <div class="settings">
      <nav class="settings-nav" :aria-label="t('settings.page.navLabel')">
        <!-- Wie die Suchleiste der Listen (SearchBar.vue), mit Enter und Sprung zum ersten Treffer -->
        <b-input-group class="mb-2">
          <b-form-input
            v-model="query"
            type="search"
            :placeholder="t('common.searchPlaceholder')"
            :aria-label="t('settings.page.searchLabel')"
            @keydown.enter.prevent="jumpToFirst"
          />
          <template #append>
            <b-button
              variant="primary"
              :aria-label="t('settings.page.firstResult')"
              @click="jumpToFirst"
            >
              <search-icon :size="20" aria-hidden="true" />
            </b-button>
          </template>
        </b-input-group>

        <!-- Beim Suchen stehen hier einzelne Einstellungen; ein Klick springt direkt hin -->
        <template v-if="query.trim() !== ''">
          <p class="cap">{{ t("settings.page.results") }}</p>
          <button v-for="r in results" :key="r.id" type="button" class="result" @click="jump(r)">
            <span>{{ r.label }}</span>
            <small>{{ sectionTitle(r.section) }}</small>
          </button>
          <p v-if="results.length === 0" class="empty">
            {{ t("settings.page.noResults", { query }) }}
          </p>
        </template>

        <template v-else>
          <p class="cap">{{ t("settings.page.general") }}</p>
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

        <database-backups v-else-if="current.id === 'backups'" />

        <template v-else>
          <section class="block" data-setting="import">
            <h3>{{ t("common.import") }}</h3>
            <data-import />
          </section>
          <section class="block">
            <h3>{{ t("settings.page.exporting") }}</h3>
            <export-center :open="openExport" />
          </section>
        </template>
      </div>
    </div>
  </b-modal>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, useTemplateRef, watch, type Component } from "vue";
  import { useI18n } from "vue-i18n";
  import { BButton, BFormInput, BInputGroup, BModal } from "bootstrap-vue-next";
  import { Database, DatabaseBackup, LayoutGrid, Search as SearchIcon } from "lucide-vue-next";
  import DatabaseBackups from "./DatabaseBackups.vue";
  import DataImport from "./DataImport.vue";
  import ExportCenter from "./ExportCenter.vue";
  import ViewPanel from "./ViewPanel.vue";

  /** Einstellungen mit Navigation und Suche: Ansicht, Daten (Import und Export) und Sicherungen */
  const props = defineProps<{
    modelValue: boolean;
    /** Offener Bereich: "view", "data" oder "backups" */
    section?: string;
    /** Einstellung, zu der beim Öffnen gesprungen wird (id eines Sucheintrags, z. B. "groups") */
    focus?: string | null;
  }>();

  const { t } = useI18n();

  const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    "update:section": [value: string];
    "update:focus": [value: null];
  }>();

  type Section = { id: string; title: string; description: string; icon: Component };

  const sectionDefs: { id: string; icon: Component }[] = [
    { id: "view", icon: LayoutGrid },
    { id: "data", icon: Database },
    { id: "backups", icon: DatabaseBackup },
  ];

  const sections = computed<Section[]>(() =>
    sectionDefs.map(def => ({
      ...def,
      title: t(`settings.sections.${def.id}.title`),
      description: t(`settings.sections.${def.id}.description`),
    }))
  );

  const current = computed(
    () => sections.value.find(s => s.id === props.section) ?? sections.value[0]!
  );

  const sectionTitle = (id: string) => sections.value.find(s => s.id === id)?.title ?? "";

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

  /** key verweist auf settings.search.<key>.label / .terms in den Locales */
  const entryDefs: {
    id: string;
    key: string;
    section: string;
    target: string;
    exportKey?: string;
  }[] = [
    { id: "view", key: "view", section: "view", target: "" },
    { id: "weekdays", key: "weekdays", section: "view", target: "weekdays" },
    { id: "breaks", key: "breaks", section: "view", target: "breaks" },
    { id: "groups", key: "groups", section: "view", target: "groups" },
    { id: "data", key: "data", section: "data", target: "" },
    { id: "import", key: "import", section: "data", target: "import" },
    {
      id: "export-pdf",
      key: "exportPdf",
      section: "data",
      target: "export:pdf",
      exportKey: "pdf",
    },
    {
      id: "export-tables",
      key: "exportTables",
      section: "data",
      target: "export:tables",
      exportKey: "tables",
    },
    { id: "backups", key: "backups", section: "backups", target: "" },
    { id: "backups-create", key: "backupsCreate", section: "backups", target: "backups-create" },
    { id: "backups-list", key: "backupsList", section: "backups", target: "backups-list" },
    { id: "backups-file", key: "backupsFile", section: "backups", target: "backups-file" },
    { id: "backups-clear", key: "backupsClear", section: "backups", target: "backups-clear" },
  ];

  const entries = computed<Entry[]>(() =>
    entryDefs.map(({ key, ...def }) => ({
      ...def,
      label: t(`settings.search.${key}.label`),
      terms: t(`settings.search.${key}.terms`),
    }))
  );

  const query = ref("");

  /** Ohne Unterschied bei Groß-/Kleinschreibung und Umlauten */
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  /** Jedes Wort muss vorkommen; Treffer im Namen stehen oben */
  const results = computed(() => {
    const words = normalize(query.value).split(/\s+/).filter(Boolean);
    return entries.value
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

  /** Springt zur gewünschten Einstellung, sobald die Einstellungen offen sind */
  function jumpToFocus() {
    const entry = entries.value.find(e => e.id === props.focus);
    if (entry !== undefined) {
      emit("update:focus", null);
      void jump(entry);
    }
  }

  /** Ob das Fenster fertig angezeigt ist; vorher gibt es die Ziele im DOM noch nicht */
  const isShown = ref(false);

  function onShown() {
    isShown.value = true;
    // Erst nachdem das Fenster seinen eigenen Fokus gesetzt hat, sonst landet er nicht im Feld
    setTimeout(jumpToFocus, 0);
  }

  // Schon offen: direkt springen, sonst nach dem Öffnen (onShown)
  watch(
    () => props.focus,
    () => {
      if (isShown.value) {
        jumpToFocus();
      }
    }
  );

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
    // Ein Eingabefeld (z. B. die Suche der Semestergruppen) vor Knöpfen fokussieren
    (
      el.querySelector<HTMLElement>("input") ?? el.querySelector<HTMLElement>("select, button")
    )?.focus({ preventScroll: true });
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
