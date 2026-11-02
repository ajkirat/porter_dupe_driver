import type { CapacitorConfig } from "@capacitor/cli";

// The Android app is a thin native shell around the live website, so every website deploy updates the app too.
// A release build must never ship pointing at an old or missing host, so CI refuses to build without the repo variable DRIVER_APP_URL.
function appUrl(): string {
  const url = process.env.DRIVER_APP_URL;
  if (process.env.CI && (!url || url.includes("netlify"))) {
    throw new Error("Set the GitHub repo variable DRIVER_APP_URL to the live Vercel address before building the app.");
  }
  return url || "https://pikopdriver.netlify.app";
}

const config: CapacitorConfig = {
  appId: "app.pikop.driver",
  appName: "Pikop Driver",
  webDir: "www",
  server: {
    url: appUrl(),
    cleartext: false,
  },
  android: { allowMixedContent: false },
};

export default config;
