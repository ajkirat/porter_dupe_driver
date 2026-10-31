import { Capacitor, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import type { LatLng } from "./geo";

// True inside the Android app, false in a normal browser.
export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

const KEY = "pikop-location-disclosure";

// Google Play requires a clear explanation, and the driver's agreement, before location is collected in the background.
export function locationDisclosureAccepted(): boolean {
  try {
    return localStorage.getItem(KEY) === "yes";
  } catch {
    return false;
  }
}

export function acceptLocationDisclosure() {
  try {
    localStorage.setItem(KEY, "yes");
  } catch {}
}

// Keeps reporting the driver's position while the screen is locked or another app is open. Android shows a
// permanent notification while this runs. Returns a function that stops it.
export async function startBackgroundLocation(
  onPosition: (p: LatLng) => void,
  text: { title: string; message: string },
): Promise<() => void> {
  const plugin = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");
  const id = await plugin.addWatcher(
    { backgroundTitle: text.title, backgroundMessage: text.message, requestPermissions: true, stale: false, distanceFilter: 10 },
    (loc) => loc && onPosition({ lat: loc.latitude, lng: loc.longitude }),
  );
  return () => void plugin.removeWatcher({ id });
}
