import { describe, expect, it } from "vitest";
import { matchesStudyGroup } from "@/composables/useViewFilters";
import { SemesterSeason } from "@/enums/enums";
import type { StudyGroup } from "@/models/StudyGroup";

const group = (abbreviation: string, name: string, year: number, season = SemesterSeason.WINTER) =>
  ({
    id: 1,
    semesterSeason: season,
    semesterYear: year,
    studentCount: 30,
    degreeProgram: { id: 1, abbreviation, name },
  }) as StudyGroup;

const inf24 = group("INF", "Informatik", 2024);
const mi24 = group("MI", "Medieninformatik", 2024);
const et25 = group("ET", "Elektrotechnik", 2025);
const wiw23 = group("WIW", "Wirtschaftsingenieurwesen", 2023);

describe("matchesStudyGroup", () => {
  it.each([
    "",
    "inf",
    "INF24_W",
    "inf24",
    "inf 24",
    "inf24w",
    "informatik",
    "w24",
    "winter 2024",
    "ws 24",
  ])("findet INF24_W mit „%s“", q => {
    expect(matchesStudyGroup(inf24, q)).toBe(true);
  });

  it.each(["inf 25", "sommer", "et", "s24"])("findet INF24_W nicht mit „%s“", q => {
    expect(matchesStudyGroup(inf24, q)).toBe(false);
  });

  it("findet kurze Kürzel nur am Anfang, längere Wörter auch mitten im Namen", () => {
    expect(matchesStudyGroup(mi24, "inf")).toBe(false);
    expect(matchesStudyGroup(mi24, "informatik")).toBe(true);
    expect(matchesStudyGroup(et25, "tech")).toBe(true);
    expect(matchesStudyGroup(wiw23, "ingenieur 23")).toBe(true);
  });

  it("ignoriert Groß-/Kleinschreibung, Umlaute und Unterstriche", () => {
    expect(matchesStudyGroup(group("WIF", "Wirtschaftsinformatik", 2025), "WIF_25")).toBe(true);
    expect(matchesStudyGroup(group("MÜ", "Müllkunde", 2025), "mu")).toBe(true);
  });
});
