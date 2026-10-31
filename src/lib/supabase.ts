"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Config = { url: string; anonKey: string };

// Values baked in at build time, if the host provided them. Otherwise ConfigGate loads
// them from /api/config before anything renders.
// Tidies a pasted URL: trims spaces and quotes, and adds https:// if it was left off.
function cleanUrl(raw: string | undefined): string {
  const v = (raw || "").trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function validUrl(v: string): boolean {
  try {
    return /^https?:$/.test(new URL(v).protocol);
  } catch {
    return false;
  }
}

let config: Config = {
  url: cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
  anonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim(),
};
let client: SupabaseClient | null = null;

export function isConfigured(): boolean {
  return validUrl(config.url) && Boolean(config.anonKey);
}

// What is missing, for the setup notice.
export function missingConfig(): string[] {
  return [...(validUrl(config.url) ? [] : ["NEXT_PUBLIC_SUPABASE_URL"]), ...(config.anonKey ? [] : ["NEXT_PUBLIC_SUPABASE_ANON_KEY"])];
}

export async function loadConfig(): Promise<void> {
  if (isConfigured()) return;
  try {
    const res = await fetch("/api/config", { cache: "no-store" });
    if (res.ok) {
      const c: Config = await res.json();
      config = { url: cleanUrl(c.url), anonKey: (c.anonKey || "").trim() };
      client = null;
    }
  } catch {
    // Leave unconfigured; the setup notice explains what to do.
  }
}

export function supabase(): SupabaseClient {
  if (!isConfigured()) {
    throw new Error("Supabase is not configured. Add the Supabase URL and anon key to the environment variables.");
  }
  client ??= createClient(config.url, config.anonKey);
  return client;
}

// Supabase RPC errors come back as { message }; surface that text to the user.
export function errorText(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}
