"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { unlockAlert } from "@/lib/alert";
import type { LatLng } from "@/lib/geo";
import { errorText, supabase } from "@/lib/supabase";
import type { Driver, DriverPass, Job } from "@/lib/types";

const PUSH_IDLE_MS = 15000;
const PUSH_TRIP_MS = 4000; // fast enough that customers see the bike move

type Prices = { daily_pass_price: number; weekly_pass_price: number };

type Ctx = {
  driver: Driver;
  pass: DriverPass | null;
  prices: Prices;
  me: LatLng | null;
  locationError: string;
  myJobs: Job[];
  openJobs: Job[];
  current: Job | undefined;
  error: string;
  clearError: () => void;
  setOnline: (online: boolean, selfiePath?: string) => Promise<boolean>;
  act: (fn: string, args: Record<string, unknown>) => Promise<boolean>;
  refresh: () => void;
  reload: () => void;
};

const DriverCtx = createContext<Ctx | null>(null);

export function useDriver(): Ctx {
  const c = useContext(DriverCtx);
  if (!c) throw new Error("useDriver must be used inside DriverProvider");
  return c;
}

// Keeps the screen awake while the driver is online or on a trip, so the phone doesn't sleep mid-delivery.
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const get = async () => {
      try {
        const l = await navigator.wakeLock.request("screen");
        if (cancelled) void l.release();
        else lock = l;
      } catch {}
    };
    void get();
    // The lock is dropped when the tab is hidden; take it again when the driver comes back.
    const onVisible = () => document.visibilityState === "visible" && void get();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [active]);
}

export function DriverProvider({
  driver,
  pass,
  reload,
  children,
}: {
  driver: Driver;
  pass: DriverPass | null;
  reload: () => void;
  children: ReactNode;
}) {
  const [me, setMe] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState("");
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [prices, setPrices] = useState<Prices>({ daily_pass_price: 75, weekly_pass_price: 500 });
  const lastPush = useRef(0);
  const pushEvery = useRef(PUSH_IDLE_MS);
  const online = driver.is_online;

  useEffect(() => {
    supabase()
      .from("settings")
      .select("daily_pass_price, weekly_pass_price")
      .single()
      .then(({ data }) => data && setPrices(data));
  }, []);

  const current = myJobs.find((j) => j.status === "accepted" || j.status === "picked_up");
  const onTrip = Boolean(current);
  useWakeLock(online || onTrip);

  // Where the driver is. Pushed to the server only while online or on a trip.
  useEffect(() => {
    pushEvery.current = onTrip ? PUSH_TRIP_MS : PUSH_IDLE_MS;
  }, [onTrip]);
  const sharing = online || onTrip;
  const sharingRef = useRef(sharing);
  useEffect(() => {
    sharingRef.current = sharing;
  }, [sharing]);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMe(p);
        setLocationError("");
        if (sharingRef.current && Date.now() - lastPush.current > pushEvery.current) {
          lastPush.current = Date.now();
          void supabase().rpc("driver_set_location", { p_lat: p.lat, p_lng: p.lng });
        }
      },
      () => setLocationError("Location is off. Turn it on so customers can see you and you can get nearby jobs."),
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  const refresh = useCallback(async () => {
    const sb = supabase();
    const { data } = await sb
      .from("jobs")
      .select("*")
      .eq("driver_id", driver.id)
      .in("status", ["assigned", "accepted", "picked_up"])
      .order("created_at");
    setMyJobs(data ?? []);
    if (online && me) {
      const { data: open } = await sb.rpc("driver_open_jobs", { p_lat: me.lat, p_lng: me.lng });
      setOpenJobs(open ?? []);
    } else {
      setOpenJobs([]);
    }
  }, [driver.id, online, me]);

  useEffect(() => {
    // Async loader: state is only set after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const sb = supabase();
    const channel = sb
      .channel(`driver-${driver.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => void refresh())
      .subscribe();
    const poll = setInterval(() => void refresh(), 15000);
    return () => {
      void sb.removeChannel(channel);
      clearInterval(poll);
    };
  }, [driver.id, refresh]);

  const act = useCallback(
    async (fn: string, args: Record<string, unknown>) => {
      setError("");
      const { error } = await supabase().rpc(fn, args);
      if (error) setError(errorText(error));
      reload();
      void refresh();
      return !error;
    },
    [reload, refresh],
  );

  const setOnline = useCallback(
    async (next: boolean, selfiePath?: string) => {
      if (next) unlockAlert(); // browsers only allow sound after a tap
      return act("driver_set_online", { p_online: next, p_selfie: selfiePath ?? null });
    },
    [act],
  );

  const value = useMemo<Ctx>(
    () => ({
      driver,
      pass,
      prices,
      me,
      locationError,
      myJobs,
      openJobs,
      current,
      error,
      clearError: () => setError(""),
      setOnline,
      act,
      refresh: () => void refresh(),
      reload,
    }),
    [driver, pass, prices, me, locationError, myJobs, openJobs, current, error, setOnline, act, refresh, reload],
  );
  return <DriverCtx.Provider value={value}>{children}</DriverCtx.Provider>;
}
