import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "./supabase";

// Android app only: ask for permission, get this phone's Firebase token and give it to the server,
// so the driver is alerted about new requests even when the app is closed.
export async function registerForPush(): Promise<void> {
  // A loud channel for requests. Android only lets the user, not the app, change it after first creation.
  await PushNotifications.createChannel({
    id: "requests",
    name: "New requests",
    description: "Alerts for new delivery requests",
    importance: 5,
    visibility: 1,
    vibration: true,
  });
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") return;
  await PushNotifications.removeAllListeners();
  await PushNotifications.addListener("registration", (t) => {
    void supabase().rpc("driver_save_push_token", { p_token: t.value });
  });
  await PushNotifications.register();
}
