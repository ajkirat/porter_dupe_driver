"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { playAlert } from "@/lib/alert";
import type { LatLng } from "@/lib/geo";
import type { Job } from "@/lib/types";
import JobCard from "./JobCard";

const SECONDS = 30;

// Full-screen "new request" popup: beeps and buzzes once, counts down, and lets the driver accept or pass.
export default function OfferModal({
  job,
  me,
  busy,
  onAccept,
  onReject,
  onExpire,
}: {
  job: Job;
  me: LatLng | null;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onExpire: () => void;
}) {
  const { t } = useT();
  const [left, setLeft] = useState(SECONDS);

  useEffect(() => {
    playAlert();
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (left <= 0) onExpire();
  }, [left, onExpire]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" role="dialog" aria-modal aria-label={t("New request")}>
      <div className="w-full max-w-md space-y-3 rounded-t-3xl bg-stone-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("New request")}</h2>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 font-bold text-white" aria-label={t("{n} seconds left", { n: Math.max(left, 0) })}>
            {Math.max(left, 0)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full bg-brand transition-all duration-1000 ease-linear" style={{ width: `${(Math.max(left, 0) / SECONDS) * 100}%` }} />
        </div>
        <JobCard job={job} from={me} />
        <div className="grid grid-cols-3 gap-2">
          <button className="btn py-3" onClick={onReject} disabled={busy}>
            {t("Pass")}
          </button>
          <button className="btn btn-primary col-span-2 py-3 text-base" onClick={onAccept} disabled={busy}>
            {t("Accept ₹{fare}", { fare: job.fare_rupees })}
          </button>
        </div>
      </div>
    </div>
  );
}
