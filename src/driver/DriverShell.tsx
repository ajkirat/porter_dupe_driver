"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import AuthScreen from "@/components/AuthScreen";
import { HomeIcon, TicketIcon, UserIcon, WalletIcon } from "@/components/icons";
import { SetupNotice } from "@/components/RequireUser";
import { useSession } from "@/components/useSession";
import { isConfigured, supabase } from "@/lib/supabase";
import type { Driver, DriverPass } from "@/lib/types";
import { DriverProvider } from "./DriverContext";
import DriverSignup from "./DriverSignup";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/earnings", label: "Earnings", Icon: WalletIcon },
  { href: "/pass", label: "Pass", Icon: TicketIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
];

function TabBar() {
  const path = usePathname();
  return (
    <nav className="grid grid-cols-4 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ href, label, Icon }) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${on ? "text-brand" : "text-stone-500"}`}>
            <Icon className="h-6 w-6" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return <div className="bg-red-600 px-4 py-1.5 text-center text-xs font-medium text-white">No internet. Reconnecting…</div>;
}

export function Frame({ children, tabs = true }: { children: ReactNode; tabs?: boolean }) {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-stone-50 shadow-xl">
      <OfflineBanner />
      <main className="flex-1 overflow-y-auto">{children}</main>
      {tabs && (
        <Suspense fallback={<div className="h-14 border-t bg-white" />}>
          <TabBar />
        </Suspense>
      )}
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col justify-center p-6 text-center">{children}</div>;
}

function Gate({ userId, phone, children }: { userId: string; phone: string; children: (d: Driver, pass: DriverPass | null, reload: () => void) => ReactNode }) {
  const [driver, setDriver] = useState<Driver | null | undefined>(undefined);
  const [pass, setPass] = useState<DriverPass | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const sb = supabase();
    const { data } = await sb.from("drivers").select("*").eq("id", userId).maybeSingle();
    setDriver(data);
    const { data: passes } = await sb
      .from("driver_passes")
      .select("*")
      .eq("driver_id", userId)
      .gt("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: false })
      .limit(1);
    setPass(passes?.[0] ?? null);
  }, [userId]);

  useEffect(() => {
    // Async loader: state is only set after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // A pass can expire while the app is open, so look again every minute.
    const t = setInterval(() => void load(), 60000);
    return () => clearInterval(t);
  }, [load]);

  if (driver === undefined) return <Frame tabs={false}><Centered><p className="text-stone-500">Loading…</p></Centered></Frame>;

  if (!driver || editing || driver.kyc_status === "rejected") {
    return (
      <Frame tabs={false}>
        <div className="space-y-4 p-4 pt-8">
          {driver?.kyc_status === "rejected" && (
            <div className="card border-red-200 bg-red-50 text-sm text-red-800">
              Your documents were not approved{driver.kyc_note ? `: ${driver.kyc_note}` : "."} Please fix and resubmit.
            </div>
          )}
          <DriverSignup
            userId={userId}
            phone={phone}
            existing={driver}
            onDone={() => {
              setEditing(false);
              void load();
            }}
          />
          <SignOut />
        </div>
      </Frame>
    );
  }

  if (driver.kyc_status === "pending") {
    return (
      <Frame tabs={false}>
        <Centered>
          <div className="card space-y-3">
            <h1 className="text-xl font-semibold">Thanks, {driver.full_name.split(" ")[0]}</h1>
            <p className="text-stone-600">We&apos;re checking your documents. You&apos;ll be able to go online once approved. This screen updates by itself.</p>
            <button className="btn w-full" onClick={() => setEditing(true)}>
              Edit details
            </button>
            <SignOut />
          </div>
        </Centered>
      </Frame>
    );
  }

  return <>{children(driver, pass, load)}</>;
}

function SignOut() {
  return (
    <button className="btn w-full" onClick={() => void supabase().auth.signOut()}>
      Sign out
    </button>
  );
}

export { SignOut };

export default function DriverShell({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (!isConfigured()) return <Frame tabs={false}><div className="p-4 pt-10"><SetupNotice /></div></Frame>;
  if (loading) return <Frame tabs={false}><Centered><p className="text-stone-500">Loading…</p></Centered></Frame>;
  if (!user)
    return (
      <Frame tabs={false}>
        <AuthScreen suffix="Driver" headline="Earn on every trip" subtitle="Keep 100% of every fare. You pay only a flat daily or weekly pass." />
      </Frame>
    );
  const phone = user.phone ? `+${user.phone.replace(/^\+/, "")}` : "";
  return (
    <Gate userId={user.id} phone={phone}>
      {(driver, pass, reload) => (
        <DriverProvider driver={driver} pass={pass} reload={reload}>
          <Frame>{children}</Frame>
        </DriverProvider>
      )}
    </Gate>
  );
}
