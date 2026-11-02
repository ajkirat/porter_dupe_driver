"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { supabase } from "@/lib/supabase";
import type { Job } from "@/lib/types";
import { useDriver } from "./DriverContext";
import PayQr from "./PayQr";

const WINDOW_MS = 30 * 60 * 1000;

// After the drop OTP the trip is complete and the customer pays: shows the amount, a payment QR and what the customer says they paid.
export default function JustDelivered() {
  const { driver, current } = useDriver();
  const { t } = useT();
  const [job, setJob] = useState<Job | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const since = new Date(Date.now() - WINDOW_MS).toISOString();
      const { data } = await supabase().from("jobs").select("*").eq("driver_id", driver.id).eq("status", "delivered").gte("delivered_at", since).order("delivered_at", { ascending: false }).limit(1).maybeSingle();
      if (alive) setJob(data);
    };
    void load();
    const timer = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [driver.id, current?.id]);

  if (!job || current || hidden.includes(job.id)) return null;
  const due = job.fare_rupees - (job.wallet_discount ?? 0);
  return (
    <div className="mx-4 mt-3 rounded-2xl bg-green-600 p-4 text-white">
      <p className="text-sm opacity-90">{t("Trip complete. Customer pays you directly.")}</p>
      <p className="text-3xl font-extrabold">₹{due}</p>
      {job.paid_via && (
        <p className="mt-2 rounded-lg bg-white/20 px-2 py-1 text-sm font-medium">
          {t("Customer says they paid by {mode}", { mode: job.paid_via === "cash" ? t("cash") : job.paid_via === "upi" ? t("UPI") : t("QR") })}
        </p>
      )}
      {!!job.wallet_discount && <p className="mt-1 text-xs opacity-90">{t("Customer used ₹{n} credit. We add ₹{n} to your wallet after delivery.", { n: job.wallet_discount })}</p>}
      <PayQr rupees={due} />
      <button className="btn mt-3 w-full !bg-white/20 text-white" onClick={() => setHidden([...hidden, job.id])}>
        {t("Done")}
      </button>
    </div>
  );
}
