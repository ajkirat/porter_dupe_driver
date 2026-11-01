"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { supabase } from "@/lib/supabase";

// A hard-to-miss "refer a driver, earn ₹" card: shows the amount the admin has set, the driver's own code and a WhatsApp share button.
// Stays hidden until the referral migration has been applied, so an older database never shows a broken card.
export default function ReferBanner() {
  const { t } = useT();
  const [info, setInfo] = useState<{ code: string; reward: number } | null>(null);

  useEffect(() => {
    const sb = supabase();
    Promise.all([sb.rpc("my_referral_code"), sb.from("settings").select("referral_driver_reward, referral_driver_enabled").single()]).then(([c, s]) => {
      if (c.error || s.error || !s.data?.referral_driver_enabled || typeof c.data !== "string") return;
      setInfo({ code: c.data, reward: s.data.referral_driver_reward });
    });
  }, []);

  if (!info) return null;
  const share = `https://wa.me/?text=${encodeURIComponent(
    `Drive with Pikop and keep every rupee of your fares. Use my referral code ${info.code} when you sign up: ${window.location.origin}`,
  )}`;

  return (
    <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-90">{t("Refer & earn")}</p>
      <p className="mt-1 text-2xl font-extrabold leading-tight">{t("Refer a driver, earn ₹{n}", { n: info.reward })}</p>
      <p className="mt-1 text-sm opacity-95">{t("You get ₹{n} in your wallet when they finish their first delivery. Use it to pay for your pass.", { n: info.reward })}</p>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white/20 px-4 py-3">
        <span className="text-xs opacity-90">{t("Your code")}</span>
        <span className="text-2xl font-extrabold tracking-widest">{info.code}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a className="btn border-0 bg-white font-semibold text-orange-700" href={share} target="_blank" rel="noreferrer">
          {t("Share on WhatsApp")}
        </a>
        <Link className="btn border-white/60 bg-transparent text-white" href="/wallet">
          {t("My wallet")}
        </Link>
      </div>
    </div>
  );
}
