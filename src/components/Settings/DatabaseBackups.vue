<template>
  <div class="backups">
    <section class="block" data-setting="backups-create">
      <h3>Sicherung erstellen</h3>
      <p class="text-muted small">
        Eine Sicherung enthält alle Daten (ohne Zugriffsrechte). Sie wird heruntergeladen und
        zusätzlich auf dem Server abgelegt.
      </p>
      <form class="create" @submit.prevent="createBackup">
        <form-input
          v-model="comment"
          type="text"
          placeholder="Name der Sicherung (optional)"
          :required="false"
          :disabled="busy !== null"
        />
        <b-button type="submit" variant="primary" class="text-nowrap" :disabled="busy !== null">
          <b-spinner v-if="busy === 'create'" small class="me-1" />
          <database-backup v-else :size="16" class="me-1" />
          Sicherung erstellen
        </b-button>
      </form>
    </section>

    <section class="block" data-setting="backups-list">
      <h3>Auf dem Server</h3>
      <div v-if="loading && backups.length === 0" class="empty"><b-spinner small /></div>
      <p v-else-if="loadError && backups.length === 0" class="empty text-danger">
        {{ loadError }}
      </p>
      <p v-else-if="backups.length === 0" class="empty">Noch keine Sicherungen vorhanden.</p>
      <list-with-search
        v-else
        class="backup-list"
        :items="backups"
        :draggable="false"
        :searchable-text="b => `${b.comment} ${formatDate(b.createdAt)}`"
        :sort-options="sortOptions"
        :show-sort-toolbar="true"
        :max-height="320"
      >
        <template #listElement="{ item: b }">
          <div class="backup">
            <span class="text">
              <span class="name" :class="{ none: b.comment === '' }">
                {{ b.comment || "Ohne Namen" }}
              </span>
              <span class="date">{{ formatDate(b.createdAt) }}</span>
            </span>
            <b-spinner v-if="busy === b.id" small class="me-2" />
            <span class="actions">
              <b-button
                variant="outline-secondary"
                size="sm"
                title="Herunterladen"
                :disabled="busy !== null"
                @click.stop="run(b.id, () => downloadBackupApi(b.id))"
              >
                <download :size="16" />
              </b-button>
              <b-button
                variant="outline-secondary"
                size="sm"
                title="Wiederherstellen"
                :disabled="busy !== null"
                @click.stop="askRestore(b)"
              >
                <archive-restore :size="16" />
              </b-button>
              <b-button
                variant="outline-danger"
                size="sm"
                title="Löschen"
                :disabled="busy !== null"
                @click.stop="askDelete(b)"
              >
                <trash2 :size="16" />
              </b-button>
            </span>
          </div>
        </template>
      </list-with-search>
    </section>

    <section class="block" data-setting="backups-file">
      <h3>Aus Datei wiederherstellen</h3>
      <p class="text-muted small">
        Lade eine heruntergeladene Sicherung (.zip) hoch. Alle aktuellen Daten werden ersetzt; der
        jetzige Stand wird vorher auf dem Server gesichert.
      </p>
      <file-drop-zone
        :model-value="selectedFile"
        :accept="['.zip']"
        @update:model-value="selectFile"
      />
      <div class="d-flex justify-content-end mt-3">
        <b-button
          variant="primary"
          :disabled="!selectedFile || busy !== null"
          @click="askRestoreFile"
        >
          <b-spinner v-if="busy === 'file'" small class="me-1" />
          {{ busy === "file" ? "Wird wiederhergestellt…" : "Wiederherstellen" }}
        </b-button>
      </div>
    </section>

    <section class="block" data-setting="backups-clear">
      <h3>Datenbank leeren</h3>
      <div class="danger">
        <span class="small text-muted">
          Löscht alle Daten (Zugriffsrechte bleiben). Vorher wird automatisch eine Sicherung
          erstellt und heruntergeladen.
        </span>
        <b-button
          variant="outline-danger"
          size="sm"
          class="text-nowrap"
          :disabled="busy !== null"
          @click="askTruncate"
        >
          <b-spinner v-if="busy === 'truncate'" small class="me-1" />
          <eraser v-else :size="16" class="me-1" />
          Datenbank leeren
        </b-button>
      </div>
    </section>

    <delete-dialog
      v-model="showConfirm"
      :title="pending?.title"
      :ok-title="pending?.okTitle"
      :action="pending?.action"
      @confirm="confirmPending"
    >
      <p class="fw-semibold mb-1">{{ pending?.subject }}</p>
      <p v-if="pending?.warning" class="small text-danger mb-0 text-center">
        {{ pending.warning }}
      </p>
    </delete-dialog>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import { BButton, BSpinner } from "bootstrap-vue-next";
  import { ArchiveRestore, DatabaseBackup, Download, Eraser, Trash2 } from "lucide-vue-next";
  import DeleteDialog from "../DeleteDialog.vue";
  import FileDropZone from "./FileDropZone.vue";
  import FormInput from "../FormInput.vue";
  import ListWithSearch from "../ListWithSearch.vue";
  import type { SortOption } from "@/models/SortOptions";
  import { useNotification } from "@/composables/useNotification";
  import {
    createBackupApi,
    deleteBackupApi,
    downloadBackupApi,
    importDumpApi,
    listBackupsApi,
    maxDumpSize,
    reloadAfterDumpImport,
    restoreBackupApi,
    truncateDatabaseApi,
    type Backup,
  } from "@/api/dump";

  /**
   * Sicherungen der ganzen Datenbank: erstellen, herunterladen, wiederherstellen und löschen.
   * Vor jedem Wiederherstellen wird der aktuelle Stand automatisch auf dem Server gesichert.
   */
  const { showSuccess, showError, handleError } = useNotification();

  const backups = ref<Backup[]>([]);
  const loading = ref(true);
  const loadError = ref<string | null>(null);
  /** Name der neuen Sicherung (beim Server: comment) */
  const comment = ref("");
  /** Laufende Aktion: "create", "file" oder die ID einer Sicherung */
  const busy = ref<string | null>(null);

  /** Hochgeladene Sicherung, die wiederhergestellt werden soll */
  const selectedFile = ref<File | null>(null);

  const sortOptions: SortOption<Backup>[] = [
    { label: "Datum", comparator: (a, b) => b.createdAt.localeCompare(a.createdAt) },
    {
      label: "Name",
      // Sicherungen ohne Namen ans Ende
      comparator: (a, b) =>
        Number(a.comment === "") - Number(b.comment === "") ||
        a.comment.localeCompare(b.comment, "de"),
    },
  ];

  /** Aktion, die erst nach Eintippen von „Bestätigen“ ausgeführt wird */
  type Pending = {
    title: string;
    okTitle: string;
    action: string;
    subject: string;
    warning?: string;
    /** Meldung nach Erfolg */
    success?: string;
    key: string;
    run: () => Promise<void>;
  };
  const pending = ref<Pending | null>(null);
  const showConfirm = ref(false);

  const dateFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const formatDate = (iso: string) => dateFormat.format(new Date(iso));

  async function loadBackups() {
    loading.value = true;
    loadError.value = null;
    try {
      backups.value = await listBackupsApi();
    } catch (error) {
      loadError.value = (error as Error).message || "Sicherungen konnten nicht geladen werden.";
    } finally {
      loading.value = false;
    }
  }

  onMounted(loadBackups);

  /** Führt eine Aktion aus, zeigt Fehler an und aktualisiert danach die Liste */
  async function run(key: string, action: () => Promise<void>, success?: string) {
    busy.value = key;
    try {
      await action();
      if (success !== undefined) {
        showSuccess(success);
      }
    } catch (error) {
      handleError(error as Error, "Sicherung fehlgeschlagen");
    } finally {
      busy.value = null;
      await loadBackups();
    }
  }

  function createBackup() {
    if (busy.value !== null) return;
    void run(
      "create",
      async () => {
        await createBackupApi(comment.value.trim());
        comment.value = "";
      },
      "Sicherung erstellt und heruntergeladen."
    );
  }

  /** Sichert den aktuellen Stand, ersetzt dann alle Daten und lädt sie neu */
  async function replaceDatabase(replace: () => Promise<void>) {
    await createBackupApi("Automatisch vor dem Wiederherstellen", false);
    await replace();
    await reloadAfterDumpImport();
  }

  const replaceWarning =
    "Alle aktuellen Daten werden ersetzt. Der jetzige Stand wird vorher automatisch auf dem Server gesichert.";

  function ask(p: Pending) {
    pending.value = p;
    showConfirm.value = true;
  }

  function confirmPending() {
    const p = pending.value;
    if (p !== null) {
      void run(p.key, p.run, p.success);
    }
  }

  function askRestore(b: Backup) {
    ask({
      title: "Sicherung wiederherstellen?",
      okTitle: "Wiederherstellen",
      action: "die Sicherung wiederherzustellen",
      subject: `${formatDate(b.createdAt)}${b.comment ? ` – ${b.comment}` : ""}`,
      warning: replaceWarning,
      success: "Sicherung wiederhergestellt.",
      key: b.id,
      run: () => replaceDatabase(() => restoreBackupApi(b.id)),
    });
  }

  function askDelete(b: Backup) {
    ask({
      title: "Sicherung löschen?",
      okTitle: "Löschen",
      action: "die Sicherung zu löschen",
      subject: `${formatDate(b.createdAt)}${b.comment ? ` – ${b.comment}` : ""}`,
      key: b.id,
      run: () => deleteBackupApi(b.id),
    });
  }

  function askTruncate() {
    ask({
      title: "Datenbank leeren?",
      okTitle: "Datenbank leeren",
      action: "alle Daten zu löschen",
      subject: "Alle Veranstaltungen, Termine, Lehrpersonen, Räume und Semestergruppen",
      warning:
        "Alle Daten werden gelöscht. Der jetzige Stand wird vorher auf dem Server gesichert und heruntergeladen.",
      success: "Datenbank geleert. Die Sicherung wurde heruntergeladen.",
      key: "truncate",
      run: async () => {
        await truncateDatabaseApi();
        await reloadAfterDumpImport();
      },
    });
  }

  function selectFile(file: File) {
    if (file.size > maxDumpSize) {
      showError("Datei zu groß", "Sicherungen dürfen höchstens 15 MB groß sein.");
      return;
    }
    selectedFile.value = file;
  }

  function askRestoreFile() {
    const file = selectedFile.value;
    if (!file) return;
    ask({
      title: "Aus Datei wiederherstellen?",
      okTitle: "Wiederherstellen",
      action: "die Sicherung wiederherzustellen",
      subject: file.name,
      warning: replaceWarning,
      success: "Sicherung wiederhergestellt.",
      key: "file",
      run: async () => {
        await replaceDatabase(() => importDumpApi(file));
        selectedFile.value = null;
      },
    });
  }
</script>

<style scoped>
  /* Abschnitte wie die der Einstellungen (SettingsPage) */
  .block {
    border-top: 1px solid var(--border-color);
    margin-top: 1rem;
    padding-top: 1rem;
  }

  h3 {
    font-size: 1rem;
    font-weight: 600;
  }

  .create {
    display: flex;
    gap: 0.5rem;
  }

  .create .btn {
    align-items: center;
    display: inline-flex;
  }

  /* Die Liste ist sonst auf die Breite der Seitenleiste begrenzt */
  .backups .backup-list {
    max-width: none;
  }

  .backup {
    align-items: center;
    display: flex;
    gap: 0.75rem;
  }

  .text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  .name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .name.none {
    color: var(--bs-secondary-color);
    font-style: italic;
    font-weight: 400;
  }

  .date {
    color: var(--bs-secondary-color);
    font-size: 0.85rem;
  }

  .actions {
    display: flex;
    flex-shrink: 0;
    gap: 0.25rem;
  }

  .actions .btn {
    align-items: center;
    display: inline-flex;
    padding: 0.25rem 0.4rem;
  }

  .danger {
    align-items: center;
    border: 1px solid var(--bs-danger-border-subtle);
    border-radius: 0.5rem;
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
    padding: 0.6rem 0.85rem;
  }

  .danger .btn {
    align-items: center;
    display: inline-flex;
  }

  .empty {
    color: var(--bs-secondary-color);
    font-size: 0.85rem;
    margin: 0;
    text-align: center;
  }
</style>
