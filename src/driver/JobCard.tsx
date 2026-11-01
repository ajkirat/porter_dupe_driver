"use client";

import { useT } from "@/i18n";
import { formatKm, formatMinutes } from "@/lib/fare";
import { haversineM, type LatLng } from "@/lib/geo";
import { PAY_AT_LABEL, type Job } from "@/lib/types";

export default function JobCard({ job, from, children }: { job: Job; from?: LatLng | null; children?: React.ReactNode }) {
  const { t } = useT();
  const away = from ? haversineM(from, { lat: job.pickup_lat, lng: job.pickup_lng }) : null;
  return (
    <div className="card space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold">₹{job.fare_rupees}</span>
        <span className="text-sm text-stone-500">
          {formatKm(job.distance_m)}
          {formatMinutes(job.duration_s) && ` · ${formatMinutes(job.duration_s)}`}
          {away !== null && ` · ${t("pickup {d} away", { d: formatKm(away) })}`}
        </span>
      </div>
      <p className="text-sm">
        <span className="text-green-700">●</span> {job.pickup_address}
      </p>
      <p className="text-sm">
        <span className="text-red-600">●</span> {job.drop_address}
      </p>
      {job.item_note && <p className="text-xs text-stone-500">{t("Item: {x}", { x: job.item_note })}</p>}
      <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-900">
        {t("Collect ₹{fare} {when} by {mode}", { fare: job.fare_rupees - (job.wallet_discount ?? 0), when: t(PAY_AT_LABEL[job.pay_at]), mode: job.payment_mode === "cash" ? t("cash") : "UPI" })}
      </p>
      {!!job.wallet_discount && <p className="text-xs text-stone-500">{t("Customer used ₹{n} credit. We add ₹{n} to your wallet after delivery.", { n: job.wallet_discount })}</p>}
      {children}
    </div>
  );
}
