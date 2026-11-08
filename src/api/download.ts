/**
 * Dateiname aus dem Content-Disposition-Header einer Antwort.
 *
 * @param response - Antwort eines Downloads
 * @returns Der Name, oder undefined, wenn der Header keinen enthält
 */
export function responseFilename(response: Response): string | undefined {
  return response.headers.get("Content-Disposition")?.match(/filename="?([^"]+)"?/)?.[1];
}

/**
 * Speichert Daten als Datei in den Downloads des Browsers.
 *
 * @param blob - Inhalt der Datei
 * @param name - Dateiname
 */
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  // Im Dokument und erst später freigeben, sonst verwirft Firefox den Download teils
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
