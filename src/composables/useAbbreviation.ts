export function useAbbreviation() {
  /** Ab dieser Länge wird ein Text abgekürzt */
  const maxLength = 24;
  /** Nur Wörter ab dieser Länge werden abgekürzt oder bekommen weiche Trennzeichen */
  const minWordLength = 11;
  /** Maximale Länge eines abgekürzten Wortes ohne Punkt */
  const maxStemLength = 8;
  const vowels = /[aeiouyäöü]/i;
  /** Bekannte Wortteile, vor denen ein langes Wort getrennt werden darf */
  const wordParts = [
    "modul",
    "pflicht",
    "person",
    "seminar",
    "projekt",
    "praktikum",
    "labor",
    "veranstaltung",
    "vorlesung",
    "übung",
    "kurs",
    "arbeit",
  ];
  const wordPartPattern = new RegExp(`(?<=\\p{L})(${wordParts.join("|")})`, "giu");

  /**
   * Kürzt ein Wort vor einem Vokal ab, der auf einen Konsonanten folgt
   * (z.B. "Wirtschaftsinformatik" -> "Wirtsch.").
   * @param word - Das abzukürzende Wort
   * @returns Das abgekürzte Wort mit Punkt
   */
  function abbreviateWord(word: string): string {
    let cut = maxStemLength;
    while (cut > 2 && !(vowels.test(word.charAt(cut)) && !vowels.test(word.charAt(cut - 1)))) {
      cut--;
    }
    return word.slice(0, cut > 2 ? cut : maxStemLength) + ".";
  }

  /**
   * Fügt in lange Wörter weiche Trennzeichen vor bekannten Wortteilen ein
   * (z.B. "Wahlpflicht-modul"). Sie erscheinen nur, wenn das Wort nicht in eine Zeile passt.
   * @param word - Das Wort
   * @returns Das Wort mit weichen Trennzeichen
   */
  function addSoftHyphens(word: string): string {
    return word.length >= minWordLength ? word.replace(wordPartPattern, "\u00AD$1") : word;
  }

  /**
   * Kürzt einen Text, damit er in eine kleine Kachel passt. Ist der Text zu lang, werden
   * nacheinander die längsten Wörter abgekürzt, bis er kurz genug ist. Danach werden
   * unsichtbare Umbruchstellen eingefügt: weiche Trennzeichen in langen Wörtern und
   * ein Umbruch nach "/" ohne Leerzeichen.
   * @param text - Der vollständige Text
   * @returns Der ggf. abgekürzte Text
   */
  function abbreviateLabel(text: string): string {
    const words = text.split(" ");
    const length = () => words.join(" ").length;

    const candidates = words
      .map((word, index) => ({ word, index }))
      .filter(({ word }) => word.length >= minWordLength)
      .sort((a, b) => b.word.length - a.word.length);

    for (const { word, index } of candidates) {
      if (length() <= maxLength) break;
      words[index] = abbreviateWord(word);
    }

    return words.map(addSoftHyphens).join(" ").replace(/\/(?=\S)/g, "/\u200B");
  }

  return {
    abbreviateLabel,
  };
}
