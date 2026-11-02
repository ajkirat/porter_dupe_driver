"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LanguagePicker from "@/i18n/LanguagePicker";
import { useT } from "@/i18n";
import DeleteAccount from "@/driver/DeleteAccount";
import { SignOut } from "@/driver/DriverShell";
import { useDriver } from "@/driver/DriverContext";
import ReferBanner from "@/driver/ReferBanner";
import DriverSignup from "@/driver/DriverSignup";
import { useVehicles } from "@/driver/useVehicles";
import { PhoneIcon } from "@/components/icons";
import { KYC_DOCS, requiredExtraDocs } from "@/lib/types";
import SoundToggle from "@/components/SoundToggle";

const ENV_SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_PHONE;

export default function Profile() {
  const { driver, reload } = useDriver();
  const vehicles = useVehicles();
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  // The number and hours come from Admin -> Settings; the env variable is the fallback.
  const [adminSupport, setAdminSupport] = useState<{ phone: string | null; hours: string | null }>({ phone: null, hours: null });
  useEffect(() => {
    supabase().from("settings").select("*").single().then(({ data }) => data && setAdminSupport({ phone: data.support_phone ?? null, hours: data.support_hours ?? null }));
  }, []);
  const SUPPORT = adminSupport.phone || ENV_SUPPORT;

  if (editing)
    return (
      <div className="space-y-3 p-4">
        <button className="text-sm text-brand" onClick={() => setEditing(false)}>
          {t("← Back")}
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
      <h1 className="text-xl font-bold">{t("Profile")}</h1>
      <div className="-mx-4">
        <ReferBanner />
      </div>
      <div className="card divide-y divide-stone-100 py-2">
        {row(t("Driver ID"), driver.driver_code ?? "")}
        {row(t("Name"), driver.full_name)}
        {row(t("Phone"), driver.phone)}
        {row(t("Vehicle"), `${vehicles.find((v) => v.code === driver.vehicle_type)?.name ?? driver.vehicle_type} · ${driver.vehicle_number}`)}
        {row("UPI", driver.upi_id ?? "")}
        <div className="pt-3">
          <button className="btn w-full" onClick={() => setEditing(true)}>
            {t("Edit details")}
          </button>
        </div>
      </div>

      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t("Documents")}</h2>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">{t("Approved")}</span>
        </div>
        {[...KYC_DOCS, ...requiredExtraDocs(driver.vehicle_type)].map((d) => (
          <div key={d.key} className="flex justify-between text-sm">
            <span>{t(d.label)}</span>
            <span className={driver.kyc_docs[d.key] ? "text-green-700" : "text-red-600"}>{driver.kyc_docs[d.key] ? t("✓ Uploaded") : t("Missing")}</span>
          </div>
        ))}
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold">{t("Need help?")}</h2>
        {adminSupport.hours && <p className="text-xs text-stone-500">{adminSupport.hours}</p>}
        {SUPPORT ? (
          <div className="grid grid-cols-2 gap-2">
            <a className="btn gap-2" href={`tel:${SUPPORT}`}>
              <PhoneIcon className="h-4 w-4" /> {t("Call us")}
            </a>
            <a className="btn" href={`https://wa.me/${SUPPORT.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        ) : (
          <p className="text-sm text-stone-500">{t("Support contact isn't set up yet.")}</p>
        )}
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold">{t("Language")}</h2>
        <LanguagePicker />
      </div>

      <SoundToggle />

      <SignOut />
      <DeleteAccount />
      <p className="text-center text-xs text-stone-400">
        Pikop Driver · <Link href="/terms" className="underline">{t("Terms")}</Link> · <Link href="/privacy" className="underline">{t("Privacy policy")}</Link>
      </p>
    </div>
  );
}
