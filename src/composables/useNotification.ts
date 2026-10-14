import { useToast } from "bootstrap-vue-next";

let toast: ReturnType<typeof useToast> | undefined = undefined;

export function useNotification() {
  /**
   * Toast wird einmal zum Start der Anwendung in der ToastInit-Komponente initialisiert
   */
  const initialize = () => {
    toast = useToast();
  };

  /**
   * Zeigt ein Toast an, wenn etwas funktioniert hat.
   *
   * @param text - Text, der bei Erfolg angezeigt werden soll
   * @returns
   */
  const showSuccess = (text: string) => {
    if (!toast) {
      return;
    }

    toast.create({
      title: "Erfolg!",
      body: text,
      variant: "success",
      position: "bottom-center",
    });
  };

  /**
   * Zeigt ein Toast an, wenn etwas nicht funktioniert hat.
   *
   * @param title - Überschrift, die angezeigt werden soll
   * @param text - Text, der bei Misserfolg angezeigt werden soll
   * @returns
   */
  const showError = (title: string, text: string) => {
    if (!toast) {
      return;
    }

    toast.create({
      title: title,
      body: text,
      variant: "danger",
      position: "bottom-center",
    });
  };

  const handleError = (error: Error, title: string) => {
    if (error instanceof TypeError) {
      showError(
        "Netzwerkfehler",
        "500 - Verbindung zum Server fehlgeschlagen. Bitte wenden Sie sich an Ihren Administrator!"
      );
    } else {
      showError(title, error.message);
    }
    // eslint-disable-next-line no-console
    console.error(error);
  };

  const handleApiErrors = async (response: Response) => {
    let errorData;
    try {
      errorData = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      errorData = null;
    }

    switch (response.status) {
      case 400:
        throw new Error("400 - Eingabe unvollständig oder ungültig.");
      case 403:
        throw new Error(
          `403 - Zugriff verweigert! Nutzer ${errorData?.shib_username} ist nicht autorisiert.`
        );
      case 404:
        throw new Error("404 - Ungültige ID oder Eintrag nicht gefunden.");
      case 409:
        throw new Error(
          "409 - Es ist ein Konflikt aufgetreten. Überprüfen Sie, ob der Eintrag bereits existiert."
        );
      case 415:
        throw new Error("415 - Das Datenformat wird nicht unterstützt.");
      case 500:
        throw new Error("500 - Fehler beim Server. Bitte wenden Sie sich an Ihren Administrator!");
      default:
        throw new Error(
          `Ein unbekannter Fehler ist aufgetreten: (${response.status}). Bitte wenden Sie sich an Ihren Administrator!`
        );
    }
  };

  return { showSuccess, showError, initialize, handleApiErrors, handleError };
}
