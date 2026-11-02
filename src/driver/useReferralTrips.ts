"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// How many deliveries a referred driver must finish before the referrer is paid (set in Admin; 5 until the database is updated).
export function useReferralTrips() {
  const [n, setN] = useState(5);
  useEffect(() => {
    supabase().from("settings").select("*").single().then(({ data }) => {
      if (data && typeof data.referral_driver_trips === "number") setN(data.referral_driver_trips);
    });
  }, []);
  return n;
}
