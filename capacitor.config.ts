import type { CapacitorConfig } from "@capacitor/cli";

// The Android app is a thin native shell around the live website, so every website deploy updates the app too.
const config: CapacitorConfig = {
  appId: "app.pikop.driver",
  appName: "Pikop Driver",
  webDir: "www",
  server: {
    url: process.env.DRIVER_APP_URL || "https://pikopdriver.netlify.app",
    cleartext: false,
  },
  android: { allowMixedContent: false },
};

export default config;
