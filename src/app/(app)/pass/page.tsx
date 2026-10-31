"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { useDriver } from "@/driver/DriverContext";
import { timeLeft } from "@/lib/earnings";
import { supabase } from "@/lib/supabase";
import type { DriverPass } from "@/lib/types";

const UPI = process.env.NEXT_PUBLIC_OPERATOR_UPI;
const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_PHONE;

export default function PassPage() {
  const { driver, pass, prices } = useDriver();
  const { t, locale } = useT();
  const [now] = useState(() => new Date());
  const [history, setHistory] = useState<DriverPass[]>([]);

  useEffect(() => {
    supabase()
      .from("driver_passes")
      .select("*")
      .eq("driver_id", driver.id)
      .order("ends_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setHistory(data ?? []));
  }, [driver.id]);

  const wa = SUPPORT ? `https://wa.me/${SUPPORT.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I paid for a Pikop pass. Driver: ${driver.full_name}, ${driver.phone}`)}` : null;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">{t("Your pass")}</h1>
      <div className={`rounded-3xl p-5 ${pass ? "bg-green-600 text-white" : "bg-stone-900 text-white"}`}>
        {pass ? (
          <>
            <p className="text-sm opacity-80">{pass.kind === "daily" ? t("Daily pass active") : t("Weekly pass active")}</p>
            <p className="text-3xl font-extrabold">{timeLeft(pass.ends_at, now, t)}</p>
            <p className="mt-1 text-xs opacity-80">{t("Until {date}", { date: new Date(pass.ends_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) })}</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-extrabold">{t("No active pass")}</p>
            <p className="mt-1 text-sm opacity-80">{t("You need a pass to go online and take requests.")}</p>
          </>
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">{t("How to buy or renew")}</h2>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-orange-50 p-3">
            <p className="text-2xl font-bold">₹{prices.daily_pass_price}</p>
            <p className="text-xs text-stone-600">{t("1 day")}</p>
          </div>
          <div className="rounded-xl bg-orange-50 p-3">
            <p className="text-2xl font-bold">₹{prices.weekly_pass_price}</p>
            <p className="text-xs text-stone-600">{t("7 days")}</p>
          </div>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-700">
          <li>{UPI ? t("Pay the amount by UPI to {upi}.", { upi: UPI }) : t("Pay the amount by UPI.")}</li>
          <li>{t("Send the payment screenshot to us on WhatsApp.")}</li>
          <li>{t("We switch your pass on, usually within minutes. Then open the Home tab and go online.")}</li>
        </ol>
        {wa && (
          <a className="btn btn-primary w-full" href={wa} target="_blank" rel="noreferrer">
            {t("Send screenshot on WhatsApp")}
          </a>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">{t("Pass history")}</h2>
        {history.length === 0 && <p className="card text-sm text-stone-500">{t("No passes yet.")}</p>}
        {history.map((p) => (
          <div key={p.id} className="card flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{p.kind === "daily" ? t("Daily pass") : t("Weekly pass")}</p>
              <p className="text-xs text-stone-500">
                {t("{a} to {b}", { a: new Date(p.starts_at).toLocaleDateString(locale, { dateStyle: "medium" }), b: new Date(p.ends_at).toLocaleDateString(locale, { dateStyle: "medium" }) })}
              </p>
            </div>
            <span className="font-semibold">₹{p.amount_rupees}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
