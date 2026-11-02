// A short beep-beep-beep and buzz for new job requests. Uses the Web Audio API so no sound file is needed.
// Browsers only allow sound after a tap, so unlockAlert() is called when the driver taps "Go online".

import { soundOn } from "./sound";

let ctx: AudioContext | null = null;

export function unlockAlert() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    // No audio support; vibration and the on-screen popup still work.
  }
}

export function playAlert() {
  if (!soundOn()) return;
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch {}
  if (!ctx) return;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    const t = ctx.currentTime + i * 0.35;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}
