import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TAGLINE } from "../lib/brand";
import { KYC_DOCS, PAY_AT_LABEL } from "../lib/types";
import { translate } from "./index";
import { TRANSLATIONS } from "./translations";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|ts)$/.test(f) && !/test|translations/.test(f) ? [p] : [];
  });
}

describe("translations", () => {
  const used = new Set<string>();
  for (const f of files("src")) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/\bt\("((?:[^"\\]|\\.)*)"/g)) used.add(m[1]);
  }
  // Strings that reach t() through variables or props instead of a literal call.
  const extra = [
    TAGLINE,
    "Pick it up, drop it off, pay the driver directly. No app wallet, no surprises.",
    "Earn on every trip",
    "Keep 100% of every fare. You pay only a flat daily or weekly pass.",
    "Home", "Earnings", "Pass", "Profile",
    "Location is off. Turn it on so customers can see you and you can get nearby jobs.",
    "Customer not reachable", "Vehicle problem", "Too far from me", "Item not allowed", "Other",
    ...Object.values(PAY_AT_LABEL),
    ...KYC_DOCS.map((d) => d.label),
  ];
  extra.forEach((k) => used.add(k));

  it("has Hindi and Kannada for every string the app uses", () => {
    const missing = [...used].filter((k) => !TRANSLATIONS[k]?.hi || !TRANSLATIONS[k]?.kn);
    expect(missing).toEqual([]);
  });

  it("keeps the same {placeholders} in every language", () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const [k, v] of Object.entries(TRANSLATIONS)) {
      expect(ph(v.hi), k).toBe(ph(k));
      expect(ph(v.kn), k).toBe(ph(k));
    }
  });

  it("fills placeholders and falls back to English", () => {
    expect(translate("hi", "Hi {name}", { name: "Ravi" })).toBe("नमस्ते Ravi");
    expect(translate("kn", "No such key {x}", { x: 1 })).toBe("No such key 1");
    expect(translate("en", "Hi {name}", { name: "Ravi" })).toBe("Hi Ravi");
  });
});
