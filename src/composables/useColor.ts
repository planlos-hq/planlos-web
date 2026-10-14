export function useColor() {
  /**
   * Berechnet die passende Schriftfarbe (schwarz oder weiß) basierend auf einer Hintergrundfarbe in Hex.
   * @param backgroundColor - Hex-Farbcode, z.B. "#FFAA00"
   * @returns "#000000" oder "#ffffff"
   */
  function calculateFontColor(backgroundColor: string): string {
    const black = "#000000";
    const white = "#FFFFFF";

    const r = parseInt(backgroundColor.substring(1, 3), 16);
    const g = parseInt(backgroundColor.substring(3, 5), 16);
    const b = parseInt(backgroundColor.substring(5, 7), 16);

    const brightness = (299 * r + 587 * g + 114 * b) / 1000;

    if (brightness > 128) {
      return black;
    } else {
      return white;
    }
  }
  return {
    calculateFontColor,
  };
}
