import { describe, expect, it } from "vitest";
import { getDateKey, getWeekDates, getWeekStart } from "../lib/fitness-store";

describe("fitness calendar helpers", () => {
  it("formats dates as stable local YYYY-MM-DD keys", () => {
    expect(getDateKey(new Date(2026, 8, 14, 12, 30))).toBe("2026-09-14");
  });

  it("normalizes any date to the Monday of its week", () => {
    const monday = getWeekStart(new Date(2026, 8, 16, 18, 0));
    expect(getDateKey(monday)).toBe("2026-09-14");
    expect(monday.getHours()).toBe(0);
  });

  it("returns seven consecutive dates for the weekly activity chart", () => {
    const dates = getWeekDates(new Date(2026, 8, 16, 12, 0));
    expect(dates).toHaveLength(7);
    expect(getDateKey(dates[0])).toBe("2026-09-14");
    expect(getDateKey(dates[6])).toBe("2026-09-20");
  });
});
