"use client";

import { useVehicles } from "./useVehicles";
import { sizeCm, sizeFeet } from "@/lib/vehicles";
import { useState } from "react";
import { DOCS_WHATSAPP, docsWhatsAppUrl } from "@/lib/brand";
import { useT } from "@/i18n";
import { uploadSelfie } from "@/lib/selfie";
import { errorText, supabase } from "@/lib/supabase";
import { KYC_DOCS, type Driver } from "@/lib/types";

// First-time signup, and re-submission after a rejected KYC.
export default function DriverSignup({
  userId,
  phone,
  existing,
  onDone,
}: {
  userId: string;
  phone: string;
  existing: Driver | null;
  onDone: () => void;
}) {
  const { t } = useT();
  const [form, setForm] = useState({
    full_name: existing?.full_name ?? "",
    vehicle_number: existing?.vehicle_number ?? "",
    vehicle_type: existing?.vehicle_type ?? "bike",
    upi_id: existing?.upi_id ?? "",
  });
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [viaWhatsApp, setViaWhatsApp] = useState(false);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [referral, setReferral] = useState("");
  const vehicles = useVehicles();

  const docs = existing?.kyc_docs ?? {};
  const missing = KYC_DOCS.filter((d) => !files[d.key] && !docs[d.key]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selfie && !docs.selfie) return setError(t("Please take a selfie. It is required."));
    if (missing.length && !viaWhatsApp) return setError(t("Please add: {list}", { list: missing.map((d) => t(d.label)).join(", ") }));
    setBusy(true);
    setError("");
    try {
      const sb = supabase();
      const uploaded: Record<string, string> = { ...docs };
      if (selfie) uploaded.selfie = await uploadSelfie(userId, selfie, "signup");
      for (const [key, file] of Object.entries(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/${key}-${Date.now()}.${ext}`;
        const { error } = await sb.storage.from("kyc").upload(path, file, { upsert: true });
        if (error) throw error;
        uploaded[key] = path;
      }
      const vehicle_number = form.vehicle_number.toUpperCase().replace(/\s/g, "");
      if (existing) {
        const { error } = await sb.rpc("driver_update_profile", {
          p_full_name: form.full_name,
          p_vehicle_number: vehicle_number,
          p_licence_number: existing?.licence_number ?? "",
          p_upi_id: form.upi_id || null,
          p_kyc_docs: uploaded,
          ...(form.vehicle_type !== "bike" || existing?.vehicle_type !== "bike" ? { p_vehicle_type: form.vehicle_type } : {}),
        });
        if (error) throw error;
      } else {
        const { error } = await sb.from("drivers").insert({
          id: userId,
          phone,
          full_name: form.full_name,
          vehicle_number,
          ...(form.vehicle_type !== "bike" ? { vehicle_type: form.vehicle_type } : {}),
          licence_number: "", // no longer asked; the column is required in the database
          upi_id: form.upi_id || null,
          kyc_docs: uploaded,
        });
        if (error) throw error;
        // A referral code is optional and must never block signing up. It can also be added later in Wallet.
        if (referral.trim()) await sb.rpc("apply_referral_code", { p_code: referral.trim(), p_wallet: "driver" });
      }
      onDone();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{existing ? t("Update your documents") : t("Drive with us")}</h1>
        <p className="mt-1 text-sm text-stone-600">
          {t("Keep every rupee of your fares. You pay only a flat daily or weekly pass once you're approved.")}
        </p>
      </div>
      <label className="label">
        {t("Full name (as on licence)")}
        <input className="input" required {...field("full_name")} />
      </label>
      <div>
        <p className="label">{t("Your vehicle")}</p>
        <div className="mt-1 space-y-2">
          {vehicles.map((v) => (
            <button
              key={v.code}
              type="button"
              onClick={() => setForm({ ...form, vehicle_type: v.code })}
              className={`w-full rounded-xl border-2 p-3 text-left ${form.vehicle_type === v.code ? "border-brand bg-orange-50" : "border-stone-200"}`}
            >
              <span className="block font-semibold">{v.name}</span>
              <span className="block text-xs text-stone-600">{t("Up to {kg} kg", { kg: v.max_kg })} · {sizeFeet(v)}</span>
              <span className="block text-xs text-stone-400">{sizeCm(v)}</span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-stone-500">{t("You will only get jobs for this vehicle.")}</p>
      </div>
      <label className="label">
        {t("Vehicle number")}
        <input className="input uppercase" placeholder="KA01AB1234" required {...field("vehicle_number")} />
      </label>
      <label className="label">
        {t("Your UPI ID (customers pay you here)")}
        <input className="input" placeholder="name@okaxis" {...field("upi_id")} />
      </label>
      {!existing && (
        <label className="label">
          {t("Referral code (optional)")}
          <input className="input uppercase" placeholder="ABC123" maxLength={8} value={referral} onChange={(e) => setReferral(e.target.value)} />
        </label>
      )}
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-brand p-3 text-sm">
        <span>
          <b>{t("Selfie (required)")}</b>
          <span className="block text-xs text-stone-500">{selfie ? selfie.name : docs.selfie ? t("Taken. Tap to retake.") : t("Take a clear photo of your face")}</span>
        </span>
        <span className={`btn shrink-0 py-1.5 ${selfie || docs.selfie ? "text-green-700" : ""}`}>{selfie || docs.selfie ? t("✓ Retake") : t("Open camera")}</span>
        <input type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => setSelfie(e.target.files?.[0] ?? selfie)} />
      </label>
      <fieldset className="space-y-2">
        <legend className="label mb-1">{t("Documents")}</legend>
        {KYC_DOCS.map((d) => (
          <label key={d.key} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-stone-200 p-3 text-sm">
            <span className="min-w-0 truncate">
              {t(d.label)}
              {files[d.key] && <span className="ml-2 text-xs text-stone-500">{files[d.key].name}</span>}
            </span>
            <span className={`btn shrink-0 py-1.5 ${files[d.key] || docs[d.key] ? "text-green-700" : ""}`}>
              {files[d.key] || docs[d.key] ? t("✓ Change") : t("Add photo")}
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              capture={d.key === "photo" ? "user" : "environment"}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFiles({ ...files, [d.key]: f });
              }}
            />
          </label>
        ))}
      </fieldset>
      <div className="space-y-2 rounded-xl bg-green-50 p-3 text-sm">
        <p className="font-medium text-green-900">{t("Easier on WhatsApp?")}</p>
        <a className="btn w-full border-green-600 text-green-800" href={docsWhatsAppUrl(form.full_name, phone)} target="_blank" rel="noreferrer">
          {t("Send documents to {n} on WhatsApp", { n: DOCS_WHATSAPP })}
        </a>
        <label className="flex items-center gap-2 text-green-900">
          <input type="checkbox" checked={viaWhatsApp} onChange={(e) => setViaWhatsApp(e.target.checked)} />{t("I'll send my documents on WhatsApp instead of uploading")}
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary w-full py-3" disabled={busy}>
        {busy ? t("Uploading…") : t("Submit for approval")}
      </button>
    </form>
  );
}
