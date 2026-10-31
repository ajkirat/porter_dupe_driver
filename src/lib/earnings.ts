// Driver earnings: no commission, so earnings are simply the fares of delivered trips.

export type EarningsJob = { fare_rupees: number; distance_m: number; delivered_at: string | null };

export type Totals = { trips: number; earned: number; distanceM: number };

export type EarningsSummary = {
  today: Totals;
  week: Totals; // the last 7 days including today
  month: Totals; // since the 1st of this month
  days: { date: Date; earned: number }[]; // last 7 days, oldest first
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function totals(jobs: EarningsJob[], from: Date): Totals {
  const t: Totals = { trips: 0, earned: 0, distanceM: 0 };
  for (const j of jobs) {
    if (!j.delivered_at || new Date(j.delivered_at) < from) continue;
    t.trips += 1;
    t.earned += j.fare_rupees;
    t.distanceM += j.distance_m;
  }
  return t;
}

export function summarize(jobs: EarningsJob[], now: Date): EarningsSummary {
  const today = startOfDay(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const next = addDays(date, 1);
    let earned = 0;
    for (const j of jobs) {
      if (!j.delivered_at) continue;
      const at = new Date(j.delivered_at);
      if (at >= date && at < next) earned += j.fare_rupees;
    }
    return { date, earned };
  });
  return {
    today: totals(jobs, today),
    week: totals(jobs, addDays(today, -6)),
    month: totals(jobs, new Date(now.getFullYear(), now.getMonth(), 1)),
    days,
  };
}

// "2 days 3 h left", "5 h 10 min left", or "Expired".
type Tr = (key: string, vars?: Record<string, string | number>) => string;
const plain: Tr = (key, vars) => (vars ? key.replace(/\{(\w+)\}/g, (_, k) => String(vars[k])) : key);

export function timeLeft(endsAt: string, now: Date, t: Tr = plain): string {
  const ms = new Date(endsAt).getTime() - now.getTime();
  if (ms <= 0) return t("Expired");
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return t(days > 1 ? "{d} days {h} h left" : "{d} day {h} h left", { d: days, h: hours });
  if (hours > 0) return t("{h} h {m} min left", { h: hours, m: mins % 60 });
  return t("{m} min left", { m: mins });
}
