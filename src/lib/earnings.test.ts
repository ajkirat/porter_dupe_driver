import { describe, expect, it } from "vitest";
import { summarize, timeLeft } from "./earnings";

const now = new Date(2026, 9, 31, 15, 0); // 31 Oct 2026, 3 pm local
const at = (dayOffset: number, hour = 10) => new Date(2026, 9, 31 + dayOffset, hour).toISOString();

describe("summarize", () => {
  const jobs = [
    { fare_rupees: 80, distance_m: 5000, delivered_at: at(0, 9) },
    { fare_rupees: 60, distance_m: 3000, delivered_at: at(0, 12) },
    { fare_rupees: 100, distance_m: 7000, delivered_at: at(-3) },
    { fare_rupees: 50, distance_m: 2000, delivered_at: at(-6) },
    { fare_rupees: 90, distance_m: 6000, delivered_at: at(-7) }, // just outside the 7 day window
    { fare_rupees: 70, distance_m: 4000, delivered_at: at(-20) }, // earlier this month? no, 11 Oct is this month
    { fare_rupees: 999, distance_m: 1, delivered_at: null },
  ];
  const s = summarize(jobs, now);

  it("totals today", () => {
    expect(s.today).toEqual({ trips: 2, earned: 140, distanceM: 8000 });
  });
  it("totals the last 7 days including today", () => {
    expect(s.week.earned).toBe(80 + 60 + 100 + 50);
    expect(s.week.trips).toBe(4);
  });
  it("totals the month and ignores unfinished jobs", () => {
    expect(s.month.earned).toBe(80 + 60 + 100 + 50 + 90 + 70);
  });
  it("gives seven day buckets, oldest first", () => {
    expect(s.days).toHaveLength(7);
    expect(s.days[6].earned).toBe(140);
    expect(s.days[3].earned).toBe(100);
    expect(s.days[0].earned).toBe(50);
  });
});

describe("timeLeft", () => {
  it("formats days, hours and minutes", () => {
    expect(timeLeft(new Date(now.getTime() + 2 * 86400000 + 3 * 3600000).toISOString(), now)).toBe("2 days 3 h left");
    expect(timeLeft(new Date(now.getTime() + 5 * 3600000 + 10 * 60000).toISOString(), now)).toBe("5 h 10 min left");
    expect(timeLeft(new Date(now.getTime() + 25 * 60000).toISOString(), now)).toBe("25 min left");
  });
  it("says Expired once past", () => {
    expect(timeLeft(new Date(now.getTime() - 1000).toISOString(), now)).toBe("Expired");
  });
});
