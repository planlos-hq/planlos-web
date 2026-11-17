<template>
  <div class="backups">
    <section class="block" data-setting="backups-create">
      <h3>{{ t("settings.backups.create") }}</h3>
      <p class="text-muted small">
        {{ t("settings.backups.createDescription") }}
      </p>
      <form class="create" @submit.prevent="createBackup">
        <form-input
          v-model="comment"
          type="text"
          :placeholder="t('settings.backups.namePlaceholder')"
          :required="false"
          :disabled="busy !== null"
        />
        <b-button type="submit" variant="primary" class="text-nowrap" :disabled="busy !== null">
          <b-spinner v-if="busy === 'create'" small class="me-1" />
          <database-backup v-else :size="16" class="me-1" />
          {{ t("settings.backups.create") }}
        </b-button>
      </form>
    </section>

    <section class="block" data-setting="backups-list">
      <h3>{{ t("settings.backups.serverTitle") }}</h3>
      <div v-if="loading && backups.length === 0" class="empty"><b-spinner small /></div>
      <p v-else-if="loadError && backups.length === 0" class="empty text-danger">
        {{ loadError }}
      </p>
      <p v-else-if="backups.length === 0" class="empty">{{ t("settings.backups.empty") }}</p>
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
                {{ b.comment || t("settings.backups.unnamed") }}
              </span>
              <span class="date">{{ formatDate(b.createdAt) }}</span>
            </span>
            <b-spinner v-if="busy === b.id" small class="me-2" />
            <span class="actions">
              <b-button
                variant="outline-secondary"
                size="sm"
                :title="t('common.download')"
                :disabled="busy !== null"
                @click.stop="run(b.id, () => downloadBackupApi(b.id))"
              >
                <download :size="16" />
              </b-button>
              <b-button
                variant="outline-secondary"
                size="sm"
                :title="t('settings.backups.restore')"
                :disabled="busy !== null"
                @click.stop="askRestore(b)"
              >
                <archive-restore :size="16" />
              </b-button>
              <b-button
                variant="outline-danger"
                size="sm"
                :title="t('common.delete')"
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
      <h3>{{ t("settings.backups.fileTitle") }}</h3>
      <p class="text-muted small">
        {{ t("settings.backups.fileDescription") }}
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
          {{ busy === "file" ? t("settings.backups.restoring") : t("settings.backups.restore") }}
        </b-button>
      </div>
    </section>

    <section class="block" data-setting="backups-clear">
      <h3>{{ t("settings.backups.clear") }}</h3>
      <div class="danger">
        <span class="small text-muted">
          {{ t("settings.backups.clearDescription") }}
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
          {{ t("settings.backups.clear") }}
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
  import { computed, onMounted, ref } from "vue";
  import { useI18n } from "vue-i18n";
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
  const { t } = useI18n();
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

  const sortOptions = computed<SortOption<Backup>[]>(() => [
    {
      label: t("settings.backups.sort.date"),
      comparator: (a, b) => b.createdAt.localeCompare(a.createdAt),
    },
    {
      label: t("common.name"),
      // Sicherungen ohne Namen ans Ende
      comparator: (a, b) =>
        Number(a.comment === "") - Number(b.comment === "") ||
        a.comment.localeCompare(b.comment, "de"),
    },
  ]);

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
      loadError.value = (error as Error).message || t("settings.backups.loadFailed");
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
      handleError(error as Error, t("settings.backups.failed"));
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
      t("settings.backups.created")
    );
  }

  /** Sichert den aktuellen Stand, ersetzt dann alle Daten und lädt sie neu */
  async function replaceDatabase(replace: () => Promise<void>) {
    await createBackupApi(t("settings.backups.autoBeforeRestore"), false);
    await replace();
    await reloadAfterDumpImport();
  }

  const replaceWarning = () => t("settings.backups.replaceWarning");

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
      title: t("settings.backups.restoreDialogTitle"),
      okTitle: t("settings.backups.restore"),
      action: t("settings.backups.restoreAction"),
      subject: `${formatDate(b.createdAt)}${b.comment ? ` – ${b.comment}` : ""}`,
      warning: replaceWarning(),
      success: t("settings.backups.restored"),
      key: b.id,
      run: () => replaceDatabase(() => restoreBackupApi(b.id)),
    });
  }

  function askDelete(b: Backup) {
    ask({
      title: t("settings.backups.deleteDialogTitle"),
      okTitle: t("common.delete"),
      action: t("settings.backups.deleteAction"),
      subject: `${formatDate(b.createdAt)}${b.comment ? ` – ${b.comment}` : ""}`,
      key: b.id,
      run: () => deleteBackupApi(b.id),
    });
  }

  function askTruncate() {
    ask({
      title: t("settings.backups.clearDialogTitle"),
      okTitle: t("settings.backups.clear"),
      action: t("settings.backups.clearAction"),
      subject: t("settings.backups.clearSubject"),
      warning: t("settings.backups.clearWarning"),
      success: t("settings.backups.cleared"),
      key: "truncate",
      run: async () => {
        await truncateDatabaseApi();
        await reloadAfterDumpImport();
      },
    });
  }

  function selectFile(file: File) {
    if (file.size > maxDumpSize) {
      showError(t("settings.backups.tooLargeTitle"), t("settings.backups.tooLarge"));
      return;
    }
    selectedFile.value = file;
  }

  function askRestoreFile() {
    const file = selectedFile.value;
    if (!file) return;
    ask({
      title: t("settings.backups.fileDialogTitle"),
      okTitle: t("settings.backups.restore"),
      action: t("settings.backups.restoreAction"),
      subject: file.name,
      warning: replaceWarning(),
      success: t("settings.backups.restored"),
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

  /* Die Liste ist sonst auf die Breite der Seitenleiste begrenzt;
     hier füllt sie die Breite und schließt bündig mit den Überschriften ab (wie in ViewPanel) */
  .backups .backup-list {
    max-width: none;
  }

  .backup-list :deep(.search-bar) {
    padding: 0 0 0.25rem;
  }

  .backup-list :deep(.sort-toolbar) {
    margin-left: 0 !important;
    padding-inline: 0 !important;
  }

  .backup-list :deep(.list-box) {
    margin-inline: 0;
    padding-inline: 0;
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
