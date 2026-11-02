"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDriver } from "@/driver/DriverContext";
import { useT } from "@/i18n";
import { useReferralTrips } from "@/driver/useReferralTrips";
import { errorText, supabase } from "@/lib/supabase";
import type { ReferralItem, WalletEntry } from "@/lib/types";

const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_PHONE;

export default function WalletPage() {
  const { driver, prices, reload } = useDriver();
  const { t, locale } = useT();
  const refTrips = useReferralTrips();
  const [balance, setBalance] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [apply, setApply] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [expiring, setExpiring] = useState<{ amount: number; expires_at: string } | null>(null);
  const [autoRenew, setAutoRenew] = useState(driver.auto_renew_pass !== false);

  const load = useCallback(async () => {
    const sb = supabase();
    const [b, c, e, r, x] = await Promise.all([
      sb.rpc("my_wallet", { p_wallet: "driver" }),
      sb.rpc("my_referral_code"),
      sb.from("wallet_entries").select("id, amount_rupees, kind, note, created_at").eq("wallet", "driver").order("created_at", { ascending: false }).limit(30),
      sb.rpc("my_referrals", { p_wallet: "driver" }),
      sb.rpc("my_wallet_expiring", { p_wallet: "driver" }),
    ]);
    setBalance(typeof b.data === "number" ? b.data : 0);
    setCode(typeof c.data === "string" ? c.data : "");
    setEntries((e.data as WalletEntry[]) ?? []);
    setReferrals((r.data as ReferralItem[]) ?? []);
    setExpiring(((x.data as { amount: number; expires_at: string }[] | null) ?? [])[0] ?? null);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void load();
  }, [load]);

  async function buy(kind: "daily" | "weekly") {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase().rpc("driver_buy_pass_with_wallet", { p_kind: kind });
    if (error) setMsg({ ok: false, text: errorText(error) });
    else {
      setMsg({ ok: true, text: t("Pass added. Open the Home tab and go online.") });
      reload();
      await load();
    }
    setBusy(false);
  }

  async function toggleAutoRenew(on: boolean) {
    setAutoRenew(on);
    const { error } = await supabase().rpc("driver_set_auto_renew", { p_on: on });
    if (error) {
      setAutoRenew(!on);
      setMsg({ ok: false, text: errorText(error) });
    }
  }

  async function applyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase().rpc("apply_referral_code", { p_code: apply, p_wallet: "driver" });
    if (error) setMsg({ ok: false, text: errorText(error) });
    else {
      setMsg({ ok: true, text: t("Code added. Your friend gets ₹ credit after your first {trips} deliveries.", { trips: refTrips }) });
      setApply("");
      await load();
    }
    setBusy(false);
  }

  const bal = balance ?? 0;
  const share = `https://wa.me/?text=${encodeURIComponent(
    `Drive with Pikop and keep every rupee of your fares. Use my referral code ${code} when you sign up: ${typeof window === "undefined" ? "" : window.location.origin}`,
  )}`;
  const cheapest = Math.min(prices.daily_pass_price, prices.weekly_pass_price);
  const topUpWa = SUPPORT
    ? `https://wa.me/${SUPPORT.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi, I want to use ₹${Math.min(bal, prices.weekly_pass_price)} of my wallet credit toward a pass and pay the rest by UPI. Driver: ${driver.full_name}, ${driver.phone}`,
      )}`
    : null;
  const label = (k: string) =>
    ({
      referral_reward: t("Referral reward"),
      ride_compensation: t("Customer used credit on a trip"),
      pass_payment: t("Used on a pass"),
      admin_adjust: t("Adjustment by Pikop"),
    })[k] ?? k;

  return (
    <div className="space-y-4 p-4">
      <Link href="/pass" className="text-sm text-brand">
        {t("← Back")}
      </Link>
      <h1 className="text-xl font-bold">{t("Wallet")}</h1>

      <div className="rounded-3xl bg-stone-900 p-5 text-white">
        <p className="text-sm opacity-80">{t("Wallet balance")}</p>
        <p className="text-4xl font-extrabold">₹{bal}</p>
        <p className="mt-1 text-xs opacity-80">{t("Use it to pay for your daily or weekly pass.")}</p>
        {expiring && (
          <p className="mt-2 rounded-lg bg-amber-400/20 px-2 py-1 text-xs text-amber-200">
            {t("₹{n} expires on {date}", { n: expiring.amount, date: new Date(expiring.expires_at).toLocaleDateString(locale, { dateStyle: "medium" }) })}
          </p>
        )}
      </div>

      {msg && <p className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-green-100 text-green-900" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

      <div className="card space-y-3">
        <h2 className="font-semibold">{t("Pay for a pass from your wallet")}</h2>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-primary" disabled={busy || bal < prices.daily_pass_price} onClick={() => buy("daily")}>
            {t("1 day · ₹{n}", { n: prices.daily_pass_price })}
          </button>
          <button className="btn btn-primary" disabled={busy || bal < prices.weekly_pass_price} onClick={() => buy("weekly")}>
            {t("7 days · ₹{n}", { n: prices.weekly_pass_price })}
          </button>
        </div>
        {bal > 0 && bal < cheapest && (
          <>
            <p className="text-sm text-stone-600">{t("Not enough for a full pass yet. You can pay the rest by UPI and we'll take ₹{n} from your wallet.", { n: bal })}</p>
            {topUpWa && (
              <a className="btn w-full" href={topUpWa} target="_blank" rel="noreferrer">
                {t("Ask us to use my wallet")}
              </a>
            )}
          </>
        )}
      </div>

      <label className="card flex items-center justify-between gap-3">
        <span>
          <span className="block font-semibold">{t("Renew my pass automatically")}</span>
          <span className="block text-xs text-stone-500">{t("When your pass ends, the same pass is bought from your wallet if there is enough credit.")}</span>
        </span>
        <input type="checkbox" className="h-5 w-5" checked={autoRenew} onChange={(e) => void toggleAutoRenew(e.target.checked)} />
      </label>

      <div className="card space-y-3">
        <h2 className="font-semibold">{t("Refer a driver")}</h2>
        <p className="text-sm text-stone-600">{t("When a driver you refer finishes {trips} deliveries, you get ₹ credit in your wallet.", { trips: refTrips })}</p>
        <div className="rounded-xl bg-orange-50 p-3 text-center">
          <p className="text-xs text-stone-500">{t("Your code")}</p>
          <p className="text-3xl font-extrabold tracking-widest">{code || "······"}</p>
        </div>
        <a className="btn btn-primary w-full" href={share} target="_blank" rel="noreferrer">
          {t("Share on WhatsApp")}
        </a>
        {referrals.length > 0 && (
          <div className="divide-y divide-stone-100">
            {referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <span>{r.who}</span>
                <span className={r.status === "rewarded" ? "font-semibold text-green-700" : "text-stone-500"}>
                  {r.status === "rewarded" ? `+₹${r.reward ?? 0}` : r.status === "capped" ? t("Limit reached") : t("Waiting for {trips} deliveries", { trips: refTrips })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={applyCode} className="card space-y-2">
        <h2 className="font-semibold">{t("Have a referral code?")}</h2>
        <p className="text-xs text-stone-500">{t("You can add one before your first delivery.")}</p>
        <div className="flex gap-2">
          <input className="input uppercase" placeholder="ABC123" maxLength={8} value={apply} onChange={(e) => setApply(e.target.value)} />
          <button className="btn shrink-0" disabled={busy || apply.trim().length < 4}>
            {t("Add code")}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <h2 className="font-semibold">{t("Wallet history")}</h2>
        {entries.length === 0 && <p className="card text-sm text-stone-500">{t("Nothing yet.")}</p>}
        {entries.map((e) => (
          <div key={e.id} className="card flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{label(e.kind)}</p>
              <p className="text-xs text-stone-500">{new Date(e.created_at).toLocaleDateString(locale, { dateStyle: "medium" })}</p>
            </div>
            <span className={`font-semibold ${e.amount_rupees > 0 ? "text-green-700" : "text-stone-700"}`}>
              {e.amount_rupees > 0 ? "+" : "−"}₹{Math.abs(e.amount_rupees)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
