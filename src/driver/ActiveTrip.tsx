"use client";

import { CheckIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { useState } from "react";
import Map from "@/components/Map";
import { useT } from "@/i18n";
import { navigationUrl } from "@/lib/geo";
import { formatKm } from "@/lib/fare";
import { useDriver } from "./DriverContext";
import SupportCall from "./SupportCall";

const CANCEL_REASONS = ["Customer not reachable", "Vehicle problem", "Too far from me", "Item not allowed", "Other"];

// The trip in progress: navigate, tell the customer you've arrived, confirm each leg with an OTP, collect payment.
export default function ActiveTrip() {
  const { current: job, me, act, error } = useDriver();
  const { t } = useT();
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  if (!job) return null;

  const pickupLeg = job.status === "accepted";
  const arrived = Boolean(job.driver_arrived_at);
  const target = pickupLeg ? { lat: job.pickup_lat, lng: job.pickup_lng } : { lat: job.drop_lat, lng: job.drop_lng };
  const contact = pickupLeg
    ? { name: job.pickup_contact_name || t("sender"), phone: job.pickup_contact_phone }
    : { name: job.receiver_name || t("receiver"), phone: job.receiver_phone };
  const showOtp = !pickupLeg || arrived;

  async function run(fn: string, args: Record<string, unknown>) {
    setBusy(true);
    const ok = await act(fn, args);
    setBusy(false);
    if (ok) setOtp("");
    return ok;
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{pickupLeg ? (arrived ? t("At pickup") : t("Go to pickup")) : t("Deliver the parcel")}</h2>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-900">{pickupLeg ? t("Step 1 of 2") : t("Step 2 of 2")}</span>
      </div>

      <div className="relative h-52 overflow-hidden rounded-2xl">
        <Map
          className="h-full"
          markers={[
            { pos: target, label: pickupLeg ? "Pickup" : "Drop", kind: pickupLeg ? "pickup" : "drop" },
            ...(me ? [{ pos: me, label: "You", kind: "driver" as const }] : []),
          ]}
        />
      </div>

      <div className="card space-y-2">
        <p className="text-sm text-stone-500">{pickupLeg ? t("Pickup") : t("Drop")}</p>
        <p className="font-medium">{pickupLeg ? job.pickup_address : job.drop_address}</p>
        {job.item_note && <p className="text-xs text-stone-500">{t("Item: {x}", { x: job.item_note })}</p>}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a className="btn btn-primary" href={navigationUrl(target)} target="_blank" rel="noreferrer">
            {t("Navigate")}
          </a>
          {contact.phone ? (
            <a className="btn gap-2" href={`tel:${contact.phone}`}>
              <PhoneIcon className="h-4 w-4" /> {t("Call {name}", { name: contact.name })}
            </a>
          ) : (
            <span className="btn opacity-50">{t("No number")}</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-green-600 p-4 text-white">
        <p className="text-sm opacity-90">{t("Customer pays after the drop OTP (cash, UPI or QR). Your earnings do not depend on how they pay.")}</p>
        <p className="text-3xl font-extrabold">₹{job.fare_rupees - (job.wallet_discount ?? 0)}</p>
        <p className="text-xs opacity-90">{t("{km} trip", { km: formatKm(job.distance_m) })}</p>
        {!!job.wallet_discount && <p className="mt-1 text-xs opacity-90">{t("Customer used ₹{n} credit. We add ₹{n} to your wallet after delivery.", { n: job.wallet_discount })}</p>}
      </div>

      {pickupLeg && !arrived && (
        <button className="btn btn-primary w-full gap-2 py-4 text-lg" disabled={busy} onClick={() => run("mark_arrived", { p_job: job.id })}>
          <PinIcon className="h-6 w-6" />
          {t("I've arrived at pickup")}
        </button>
      )}

      {showOtp && (
        <form
          className="card space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(pickupLeg ? "mark_picked_up" : "mark_delivered", { p_job: job.id, p_otp: otp });
          }}
        >
          <label className="label">
            {pickupLeg ? t("Pickup OTP from the sender") : t("Drop OTP from the receiver")}
            <input
              className="input text-center text-2xl tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <button className="btn btn-primary w-full gap-2 py-4 text-lg" disabled={busy || otp.length !== 4}>
            <CheckIcon className="h-6 w-6" />
            {pickupLeg ? t("Confirm pickup") : t("Confirm delivery")}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {pickupLeg &&
        (cancelling ? (
          <div className="card space-y-2">
            <p className="label">{t("Why are you dropping this job?")}</p>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {CANCEL_REASONS.map((r) => (
                <option key={r} value={r}>{t(r)}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn" onClick={() => setCancelling(false)}>
                {t("Keep job")}
              </button>
              <button className="btn btn-danger" disabled={busy} onClick={() => run("driver_cancel_job", { p_job: job.id, p_reason: reason })}>
                {t("Drop job")}
              </button>
            </div>
            <p className="text-xs text-stone-500">{t("The job goes back to other drivers. Dropping often may affect your account.")}</p>
          </div>
        ) : (
          <button className="w-full py-2 text-sm text-stone-500 underline" onClick={() => setCancelling(true)}>
            {t("Can't do this job?")}
          </button>
        ))}
      <SupportCall />
    </div>
  );
}
