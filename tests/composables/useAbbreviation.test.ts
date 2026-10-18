import { describe, expect, it } from "vitest";
import { useAbbreviation } from "@/composables/useAbbreviation";

const { abbreviateLabel } = useAbbreviation();

/** Weiches Trennzeichen, nur sichtbar wenn dort umgebrochen wird */
const shy = "\u00AD";

describe("abbreviateLabel", () => {
  it.each(["Test", "Externe Lehrperson", "Praktikum / Labor"])(
    "lässt kurze Texte unverändert: %s",
    text => {
      expect(abbreviateLabel(text)).toBe(text);
    }
  );

  it("kürzt nur so viele Wörter wie nötig, das längste zuerst", () => {
    expect(abbreviateLabel("Test Seminar mit Präsentation")).toBe("Test Seminar mit Präsent.");
    expect(abbreviateLabel("Interdisziplinäres Projektseminar")).toBe(
      `Interd. Projekt${shy}seminar`
    );
  });

  it("schneidet Wörter vor einem Vokal nach einem Konsonanten ab", () => {
    expect(
      abbreviateLabel(
        "Test Interdisziplinäres Wirtschaftsinformatikvertiefungsmodul mit Abschlussprojekt"
      )
    ).toBe("Test Interd. Wirtsch. mit Abschl.");
  });

  it("fügt in langen Wörtern weiche Trennzeichen vor bekannten Wortteilen ein", () => {
    expect(abbreviateLabel("Pflichtmodul")).toBe(`Pflicht${shy}modul`);
    expect(abbreviateLabel("Wahlpflichtmodul")).toBe(`Wahl${shy}pflicht${shy}modul`);
  });

  it("erlaubt einen Umbruch nach / ohne Leerzeichen", () => {
    expect(abbreviateLabel("Praktikum/Labor")).toBe("Praktikum/\u200BLabor");
  });
});
