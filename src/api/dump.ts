import { useNotification } from "@/composables/useNotification";
import { useUndoStore } from "@/stores/undoStore";
import { responseFilename, saveBlob } from "./download";
import { reloadAllData } from "./globalGalactic";

// eslint-disable-next-line @typescript-eslint/naming-convention
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Größte Datei, die der Server beim Wiederherstellen annimmt */
export const maxDumpSize = 15 * 1024 * 1024;

/** Eine Sicherung der Datenbank, die auf dem Server liegt */
export type Backup = {
  id: string;
  filename: string;
  comment: string;
  /** Zeitpunkt im RFC-3339-Format (UTC) */
  createdAt: string;
  schemaVersion: number;
};

async function check(response: Response) {
  if (!response.ok) {
    await useNotification().handleApiErrors(response);
  }
}

/** Speichert eine Sicherung aus der Antwort; der Server nennt sie ohne .zip */
async function saveBackup(response: Response) {
  const name = responseFilename(response) ?? "sicherung.stdp";
  saveBlob(await response.blob(), name.endsWith(".zip") ? name : `${name}.zip`);
}

/**
 * Lädt die Liste der Sicherungen auf dem Server
 *
 * @returns Sicherungen, die neueste zuerst
 */
export async function listBackupsApi(): Promise<Backup[]> {
  const response = await fetch(`${API_BASE_URL}/backups`, {
    headers: { Accept: "application/json" },
  });
  await check(response);
  const backups: Backup[] = await response.json();
  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Sichert die Datenbank auf dem Server
 *
 * @param comment - Kommentar zur Sicherung
 * @param download - ob die Sicherung auch im Browser heruntergeladen wird
 */
export async function createBackupApi(comment: string, download = true) {
  const response = await fetch(`${API_BASE_URL}/export/dump?${new URLSearchParams({ comment })}`);
  await check(response);
  if (download) {
    await saveBackup(response);
  } else {
    await response.body?.cancel();
  }
}

/**
 * Lädt eine Sicherung vom Server herunter
 *
 * @param id - ID der Sicherung
 */
export async function downloadBackupApi(id: string) {
  const response = await fetch(`${API_BASE_URL}/backups/${encodeURIComponent(id)}`);
  await check(response);
  await saveBackup(response);
}

/**
 * Löscht eine Sicherung vom Server
 *
 * @param id - ID der Sicherung
 */
export async function deleteBackupApi(id: string) {
  const response = await fetch(`${API_BASE_URL}/backups/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  await check(response);
}

/**
 * Ersetzt alle Daten durch eine Sicherung vom Server
 *
 * @param id - ID der Sicherung
 */
export async function restoreBackupApi(id: string) {
  const response = await fetch(`${API_BASE_URL}/backups/restore/${encodeURIComponent(id)}`, {
    method: "POST",
  });
  await check(response);
}

/**
 * Ersetzt alle Daten durch eine hochgeladene Sicherung (.zip)
 *
 * @param file - Sicherung, wie sie heruntergeladen wurde
 */
export async function importDumpApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/import/dump`, {
    method: "POST",
    body: formData,
  });
  await check(response);
}

/**
 * Leert die ganze Datenbank (außer den Zugriffsrechten). Der Server sichert vorher
 * den aktuellen Stand; diese Sicherung wird auch heruntergeladen.
 */
export async function truncateDatabaseApi() {
  const response = await fetch(
    `${API_BASE_URL}/truncate?${new URLSearchParams({ comment: "Automatisch vor dem Leeren der Datenbank" })}`,
    { method: "POST" }
  );
  await check(response);
  await saveBackup(response);
}

/**
 * Nach dem Ersetzen der Datenbank alles neu laden. Der Verlauf für Rückgängig
 * bezieht sich auf die alten Daten und wird verworfen.
 */
export async function reloadAfterDumpImport() {
  useUndoStore().clear();
  await reloadAllData();
}
