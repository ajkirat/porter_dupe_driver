"use client";

import { useEffect, useState } from "react";
import type { EarningsJob } from "@/lib/earnings";
import { supabase } from "@/lib/supabase";

// Delivered trips since the first of last month (enough for today / week / month and a short history).
export type DeliveredJob = EarningsJob & { id: string; pickup_address: string; drop_address: string; pay_at: string };

export function useDelivered(driverId: string, reloadKey: string) {
  const [jobs, setJobs] = useState<DeliveredJob[] | null>(null);
  useEffect(() => {
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    let alive = true;
    supabase()
      .from("jobs")
      .select("id, fare_rupees, distance_m, delivered_at, pickup_address, drop_address, pay_at")
      .eq("driver_id", driverId)
      .eq("status", "delivered")
      .gte("delivered_at", since)
      .order("delivered_at", { ascending: false })
      .then(({ data }) => alive && setJobs((data as DeliveredJob[]) ?? []));
    return () => {
      alive = false;
    };
  }, [driverId, reloadKey]);
  return jobs;
}
