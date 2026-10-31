"use client";

import { useState } from "react";
import { SignOut } from "@/driver/DriverShell";
import { useDriver } from "@/driver/DriverContext";
import DriverSignup from "@/driver/DriverSignup";
import { PhoneIcon } from "@/components/icons";
import { KYC_DOCS } from "@/lib/types";

const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_PHONE;

export default function Profile() {
  const { driver, reload } = useDriver();
  const [editing, setEditing] = useState(false);

  if (editing)
    return (
      <div className="space-y-3 p-4">
        <button className="text-sm text-brand" onClick={() => setEditing(false)}>
          ← Back
        </button>
        <DriverSignup
          userId={driver.id}
          phone={driver.phone}
          existing={driver}
          onDone={() => {
            setEditing(false);
            reload();
          }}
        />
      </div>
    );

  const row = (k: string, v: string) => (
    <div className="flex justify-between gap-3 py-2 text-sm">
      <span className="text-stone-500">{k}</span>
      <span className="text-right font-medium">{v || "—"}</span>
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Profile</h1>
      <div className="card divide-y divide-stone-100 py-2">
        {row("Name", driver.full_name)}
        {row("Phone", driver.phone)}
        {row("Bike", driver.vehicle_number)}
        {row("Licence", driver.licence_number)}
        {row("UPI", driver.upi_id ?? "")}
        <div className="pt-3">
          <button className="btn w-full" onClick={() => setEditing(true)}>
            Edit details
          </button>
        </div>
      </div>

      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Documents</h2>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Approved</span>
        </div>
        {KYC_DOCS.map((d) => (
          <div key={d.key} className="flex justify-between text-sm">
            <span>{d.label}</span>
            <span className={driver.kyc_docs[d.key] ? "text-green-700" : "text-red-600"}>{driver.kyc_docs[d.key] ? "✓ Uploaded" : "Missing"}</span>
          </div>
        ))}
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold">Need help?</h2>
        {SUPPORT ? (
          <div className="grid grid-cols-2 gap-2">
            <a className="btn gap-2" href={`tel:${SUPPORT}`}>
              <PhoneIcon className="h-4 w-4" /> Call us
            </a>
            <a className="btn" href={`https://wa.me/${SUPPORT.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        ) : (
          <p className="text-sm text-stone-500">Support contact isn&apos;t set up yet.</p>
        )}
      </div>

      <SignOut />
      <p className="text-center text-xs text-stone-400">Pikop Driver</p>
    </div>
  );
}
