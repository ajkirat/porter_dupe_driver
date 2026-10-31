"use client";

import { useEffect, useMemo, useState } from "react";
import { useDriver } from "@/driver/DriverContext";
import { useDelivered } from "@/driver/useDelivered";
import { summarize } from "@/lib/earnings";
import { formatKm } from "@/lib/fare";
import { supabase } from "@/lib/supabase";

export default function Earnings() {
  const { driver } = useDriver();
  const jobs = useDelivered(driver.id, "earnings");
  const [now] = useState(() => new Date());
  const [passCost, setPassCost] = useState(0);
  const s = useMemo(() => (jobs ? summarize(jobs, now) : null), [jobs, now]);

  // Pass money paid this month, so the driver sees what they really kept.
  useEffect(() => {
    const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    supabase()
      .from("driver_passes")
      .select("amount_rupees")
      .eq("driver_id", driver.id)
      .gte("starts_at", first)
      .then(({ data }) => setPassCost((data ?? []).reduce((a, p) => a + p.amount_rupees, 0)));
  }, [driver.id, now]);

  if (!s || !jobs) return <p className="p-6 text-center text-stone-500">Loading…</p>;
  const max = Math.max(1, ...s.days.map((d) => d.earned));
  const rows: [string, typeof s.today][] = [
    ["Today", s.today],
    ["Last 7 days", s.week],
    ["This month", s.month],
  ];

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Earnings</h1>
      <div className="rounded-3xl bg-stone-900 p-5 text-white">
        <p className="text-sm opacity-70">This month, after pass cost</p>
        <p className="text-4xl font-extrabold">₹{s.month.earned - passCost}</p>
        <p className="mt-1 text-xs opacity-70">
          ₹{s.month.earned} earned − ₹{passCost} passes · {s.month.trips} trips · {formatKm(s.month.distanceM)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {rows.map(([label, t]) => (
          <div key={label} className="card p-3">
            <p className="text-xs text-stone-500">{label}</p>
            <p className="text-lg font-bold">₹{t.earned}</p>
            <p className="text-xs text-stone-500">{t.trips} trips</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="mb-3 text-sm font-medium">Last 7 days</p>
        <div className="flex h-32 items-end gap-2" role="img" aria-label="Daily earnings, last 7 days">
          {s.days.map((d) => (
            <div key={d.date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-stone-500">{d.earned ? `₹${d.earned}` : ""}</span>
              <div className="w-full rounded-t-md bg-brand" style={{ height: `${Math.max(4, (d.earned / max) * 88)}px`, opacity: d.earned ? 1 : 0.2 }} />
              <span className="text-[10px] text-stone-500">{d.date.toLocaleDateString("en-IN", { weekday: "short" })}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Recent trips</h2>
        {jobs.length === 0 && <p className="card text-sm text-stone-500">Your delivered trips will show up here.</p>}
        {jobs.slice(0, 30).map((j) => (
          <div key={j.id} className="card flex items-start justify-between gap-3 p-3">
            <div className="min-w-0 text-sm">
              <p className="truncate">{j.pickup_address}</p>
              <p className="truncate text-stone-500">→ {j.drop_address}</p>
              <p className="mt-1 text-xs text-stone-400">
                {new Date(j.delivered_at!).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {formatKm(j.distance_m)}
              </p>
            </div>
            <span className="font-bold">₹{j.fare_rupees}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
