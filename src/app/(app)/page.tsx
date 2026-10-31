"use client";

import { useMemo, useRef, useState } from "react";
import Map from "@/components/Map";
import ActiveTrip from "@/driver/ActiveTrip";
import { useDriver } from "@/driver/DriverContext";
import JobCard from "@/driver/JobCard";
import OfferModal from "@/driver/OfferModal";
import { useDelivered } from "@/driver/useDelivered";
import { summarize, timeLeft } from "@/lib/earnings";
import { uploadSelfie } from "@/lib/selfie";
import { errorText } from "@/lib/supabase";

function OnlineCard() {
  const { driver, pass, setOnline, error, locationError, clearError } = useDriver();
  const [busy, setBusy] = useState(false);
  const [selfieError, setSelfieError] = useState("");
  const camera = useRef<HTMLInputElement>(null);
  const online = driver.is_online;

  // Going online needs a fresh selfie every time: open the front camera, upload it, then switch on.
  async function onSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const path = await uploadSelfie(driver.id, file, "online");
      await setOnline(true, path);
    } catch (err) {
      setSelfieError(errorText(err));
    }
    setBusy(false);
  }

  return (
    <div className={`m-4 rounded-3xl p-5 text-white ${online ? "bg-green-600" : "bg-stone-900"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm opacity-80">Hi {driver.full_name.split(" ")[0]}</p>
          <p className="text-2xl font-extrabold">{online ? "You're online" : "You're offline"}</p>
          <p className="mt-1 text-xs opacity-80">{online ? "New requests will pop up here" : pass ? "Go online to get requests" : "Buy a pass to go online"}</p>
        </div>
        <button
          role="switch"
          aria-checked={online}
          aria-label="Online"
          disabled={busy || (!pass && !online)}
          onClick={async () => {
            clearError();
            setSelfieError("");
            if (!online) return camera.current?.click();
            setBusy(true);
            await setOnline(false);
            setBusy(false);
          }}
          className={`relative h-12 w-24 shrink-0 rounded-full transition disabled:opacity-40 ${online ? "bg-white/30" : "bg-white/20"}`}
        >
          <span className={`absolute top-1 h-10 w-10 rounded-full bg-white shadow transition-all ${online ? "left-[3.2rem]" : "left-1"}`} />
        </button>
      </div>
      <input ref={camera} type="file" accept="image/*" capture="user" className="sr-only" onChange={onSelfie} />
      {!online && pass && <p className="mt-3 text-xs opacity-80">You&apos;ll take a quick selfie each time you go online.</p>}
      {selfieError && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-red-700">{selfieError}</p>}
      {!pass && !online && <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm">No active pass. Open the Pass tab to see how to buy one.</p>}
      {error && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-red-700">{error}</p>}
      {locationError && <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm">{locationError}</p>}
    </div>
  );
}

function PassWarning() {
  const { pass } = useDriver();
  const [now] = useState(() => new Date());
  if (!pass) return null;
  const hoursLeft = (new Date(pass.ends_at).getTime() - now.getTime()) / 3600000;
  if (hoursLeft > 24) return null;
  return (
    <div className="mx-4 mt-3 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
      Your pass ends soon: {timeLeft(pass.ends_at, now)}. Renew from the Pass tab to keep getting requests.
    </div>
  );
}

function TodayStrip() {
  const { driver, current } = useDriver();
  const jobs = useDelivered(driver.id, current?.id ?? "idle");
  const [now] = useState(() => new Date());
  const today = useMemo(() => (jobs ? summarize(jobs, now).today : null), [jobs, now]);
  return (
    <div className="mx-4 grid grid-cols-2 gap-3">
      <div className="card py-3">
        <p className="text-xs text-stone-500">Today&apos;s earnings</p>
        <p className="text-2xl font-extrabold">₹{today?.earned ?? 0}</p>
      </div>
      <div className="card py-3">
        <p className="text-xs text-stone-500">Trips today</p>
        <p className="text-2xl font-extrabold">{today?.trips ?? 0}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { driver, me, myJobs, openJobs, current, act, refresh } = useDriver();
  const [snoozed, setSnoozed] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const offers = myJobs.filter((j) => j.status === "assigned");
  const popup = driver.is_online && !current ? [...offers, ...openJobs].find((j) => !snoozed.includes(j.id)) : undefined;
  const popupId = popup?.id;

  async function accept(id: string) {
    setBusy(true);
    await act("accept_job", { p_job: id });
    setBusy(false);
  }

  if (current) return <ActiveTrip />;

  const list = [...offers, ...openJobs];
  return (
    <div className="pb-4">
      <OnlineCard />
      <TodayStrip />
      <PassWarning />

      <div className="relative mx-4 mt-4 h-44 overflow-hidden rounded-2xl">
        <Map className="h-full" markers={me ? [{ pos: me, label: "You", kind: "driver" }] : []} focus={me ? { ...me, zoom: 14, n: 1 } : null} />
      </div>

      {driver.is_online && (
        <div className="mt-4 space-y-3 px-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Requests near you</h2>
            <button className="text-sm text-brand" onClick={refresh}>
              Refresh
            </button>
          </div>
          {!me && <p className="text-sm text-stone-500">Waiting for your location…</p>}
          {me && list.length === 0 && <p className="card text-sm text-stone-500">No requests nearby right now. Stay online; this updates by itself.</p>}
          {list.map((job) => (
            <JobCard key={job.id} job={job} from={me}>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button className="btn" disabled={busy} onClick={() => act("reject_job", { p_job: job.id })}>
                  Hide
                </button>
                <button className="btn btn-primary" disabled={busy} onClick={() => accept(job.id)}>
                  Accept
                </button>
              </div>
            </JobCard>
          ))}
        </div>
      )}

      {popup && (
        <OfferModal
          key={popup.id}
          job={popup}
          me={me}
          busy={busy}
          onAccept={() => accept(popup.id)}
          onReject={() => act("reject_job", { p_job: popup.id })}
          onExpire={() => setSnoozed((s) => (popupId && !s.includes(popupId) ? [...s, popupId] : s))}
        />
      )}
    </div>
  );
}
