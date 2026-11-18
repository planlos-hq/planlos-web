import { describe, expect, it } from "vitest";
import { createTimeFormat, toTimeValue } from "@/composables/useTimeFormat";

const de = createTimeFormat("de");
const en = createTimeFormat("en");
/** Leerzeichen vor AM/PM ist je nach ICU-Version normal oder schmal (U+202F) */
const plain = (text: string) => text.replace(/\s/g, " ");

describe("createTimeFormat", () => {
  it("nimmt 12 oder 24 Stunden aus der Sprache", () => {
    expect(de.twelveHour).toBe(false);
    expect(en.twelveHour).toBe(true);
    // Sprachen ohne eigene Einstellung
    expect(createTimeFormat("fr").twelveHour).toBe(false);
    expect(createTimeFormat("ko").twelveHour).toBe(true);
  });

  it("formatiert in der Sprache, Mitternacht am Tagesende als 0 Uhr", () => {
    expect(de.formatMinutes(8 * 60)).toBe("08:00");
    expect(de.formatMinutes(13 * 60 + 30)).toBe("13:30");
    expect(de.formatMinutes(24 * 60)).toBe("00:00");
    expect(plain(en.formatMinutes(8 * 60))).toBe("8:00 AM");
    expect(plain(en.formatMinutes(13 * 60 + 30))).toBe("1:30 PM");
    expect(plain(en.formatMinutes(24 * 60))).toBe("12:00 AM");
  });

  it.each([
    ["13:30", 13 * 60 + 30],
    ["1330", 13 * 60 + 30],
    ["9", 9 * 60],
    ["9.15", 9 * 60 + 15],
    ["00:00", 0],
  ])("liest %s in beiden Sprachen", (text, minutes) => {
    expect(de.parse(text)).toBe(minutes);
    expect(en.parse(text)).toBe(minutes);
  });

  it.each([
    ["1:30 PM", 13 * 60 + 30],
    ["1:30pm", 13 * 60 + 30],
    ["1:30 p.m.", 13 * 60 + 30],
    ["12:00 AM", 0],
    ["12:15 PM", 12 * 60 + 15],
    ["11:30 am", 11 * 60 + 30],
    ["8:00 p", 20 * 60],
    ["8p", 20 * 60],
    ["8:00 P", 20 * 60],
    ["12 a", 0],
    ["9:15 a", 9 * 60 + 15],
    ["6:30 pa", 18 * 60 + 30],
    ["6:30 ap", 6 * 60 + 30],
    ["12 ma", 12 * 60],
  ])("liest AM/PM: %s", (text, minutes) => {
    expect(en.parse(text)).toBe(minutes);
  });

  it("liest, was es selbst formatiert", () => {
    for (const minutes of [8 * 60, 12 * 60, 13 * 60 + 45, 23 * 60 + 45]) {
      expect(en.parse(en.formatMinutes(minutes))).toBe(minutes);
      expect(de.parse(de.formatMinutes(minutes))).toBe(minutes);
    }
  });

  it.each(["", "abc", "25:00", "12:75"])("lehnt ungültige Eingaben ab: %j", text => {
    expect(de.parse(text)).toBeUndefined();
  });
});

describe("toTimeValue", () => {
  it("gibt HH:MM in 24 Stunden zurück, Mitternacht als 00:00", () => {
    expect(toTimeValue(8 * 60 + 5)).toBe("08:05");
    expect(toTimeValue(24 * 60)).toBe("00:00");
  });
});
