"use client";

import { useEffect, useState } from "react";
import { PhoneIcon } from "@/components/icons";
import { useT } from "@/i18n";
import { supabase } from "@/lib/supabase";

// One-tap "call Pikop" for the moments a driver is stuck. The number is set by the admin in Settings.
export default function SupportCall() {
  const { t } = useT();
  const [phone, setPhone] = useState<string | null>(process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? null);
  useEffect(() => {
    supabase().from("settings").select("support_phone").single().then(({ data }) => data?.support_phone && setPhone(data.support_phone));
  }, []);
  if (!phone) return null;
  return (
    <a className="btn w-full gap-2 py-3 text-base" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
      <PhoneIcon className="h-5 w-5" /> {t("Call Pikop for help")}
    </a>
  );
}
