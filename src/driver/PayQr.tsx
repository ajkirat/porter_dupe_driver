"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { upiLink, validVpa } from "@/lib/upi";
import { useDriver } from "./DriverContext";

// A QR the customer scans to pay this driver directly. Built from the driver's own UPI ID; Pikop never sees the money.
export default function PayQr({ rupees }: { rupees: number }) {
  const { driver } = useDriver();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState("");
  const vpa = validVpa(driver.upi_id) ? driver.upi_id : null;

  useEffect(() => {
    if (!open || !vpa) return;
    let live = true;
    QRCode.toDataURL(upiLink({ vpa, name: driver.full_name, rupees, note: "Pikop delivery" }), { margin: 2, width: 260 }).then((u) => live && setImg(u));
    return () => {
      live = false;
    };
  }, [open, vpa, rupees, driver.full_name]);

  if (!vpa) return <p className="mt-2 text-xs opacity-90">{t("Add a valid UPI ID in Profile to show a payment QR.")}</p>;
  return (
    <div className="mt-3">
      <button className="btn w-full !bg-white text-green-800" onClick={() => setOpen(!open)}>
        {open ? t("Hide QR") : t("Show payment QR")}
      </button>
      {open && img && (
        <div className="mt-3 rounded-xl bg-white p-3 text-center text-stone-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="UPI QR" width={260} height={260} className="mx-auto" />
          <p className="text-xs text-stone-600">{t("Customer scans this to pay ₹{fare}", { fare: rupees })}</p>
        </div>
      )}
    </div>
  );
}
