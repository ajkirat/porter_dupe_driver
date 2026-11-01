"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BIKE_ONLY, type VehicleType } from "@/lib/vehicles";

// Vehicle types a driver can choose from. Falls back to Bike until migration 0013 is applied.
export function useVehicles(): VehicleType[] {
  const [list, setList] = useState<VehicleType[]>(BIKE_ONLY);
  useEffect(() => {
    supabase()
      .from("vehicle_types")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => data && data.length > 0 && setList(data as VehicleType[]));
  }, []);
  return list;
}
