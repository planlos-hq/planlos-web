import { describe, expect, it } from "vitest";
import { parseViewQuery } from "@/router/viewQuery";
import { WeekDays } from "@/enums/enums";

describe("parseViewQuery hiddenWeekdays", () => {
  it("keeps hidden weekdays from the link", () => {
    const view = parseViewQuery({ hiddenWeekdays: ["sat", "sun"] });
    expect(view.hiddenWeekdays).toEqual([WeekDays.SAMSTAG, WeekDays.SONNTAG]);
  });

  it("shows all weekdays when the link hides every day", () => {
    const view = parseViewQuery({ hiddenWeekdays: Object.values(WeekDays) });
    expect(view.hiddenWeekdays).toEqual([]);
  });
});
