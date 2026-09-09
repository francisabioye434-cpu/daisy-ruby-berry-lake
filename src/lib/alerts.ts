const DAY_KEY = "fairline-alert-day";
const IDS_KEY = "fairline-alert-ids";
const BRIEF_KEY = "fairline-alert-brief";

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadDay(): { day: string; ids: string[] } {
  if (typeof window === "undefined") return { day: todayKey(), ids: [] };
  const day = localStorage.getItem(DAY_KEY) || "";
  const ids = JSON.parse(localStorage.getItem(IDS_KEY) || "[]") as string[];
  if (day !== todayKey()) return { day: todayKey(), ids: [] };
  return { day, ids };
}

function save(ids: string[]) {
  localStorage.setItem(DAY_KEY, todayKey());
  localStorage.setItem(IDS_KEY, JSON.stringify(ids.slice(-80)));
}

export function alreadyAlerted(id: string): boolean {
  return loadDay().ids.includes(id);
}

export function markAlerted(id: string) {
  const { ids } = loadDay();
  if (ids.includes(id)) return;
  save([...ids, id]);
}

export function briefSentToday(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(BRIEF_KEY) === todayKey();
}

export function markBriefSent() {
  localStorage.setItem(BRIEF_KEY, todayKey());
}

export async function enableAlerts(): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/fairline-sw.js");
      await navigator.serviceWorker.ready;
      const periodic = (reg as ServiceWorkerRegistration & {
        periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
      }).periodicSync;
      if (periodic) {
        const status = await navigator.permissions.query({ name: "periodic-background-sync" as PermissionName });
        if (status.state === "granted") {
          await periodic.register("fairline-daily", { minInterval: 12 * 60 * 60 * 1000 });
        }
      }
    } catch {
      /* SW optional */
    }
  }
  return true;
}

export function pushNotice(title: string, body: string, tag: string) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  const payload = { type: "NOTIFY", title, body, tag, url: "/", renotify: false };
  const sw = navigator.serviceWorker?.controller;
  if (sw) {
    sw.postMessage(payload);
    return;
  }
  try {
    new Notification(title, { body, tag, icon: "/icon-192.png" });
  } catch {
    /* ignore */
  }
}

export async function registerFairlineWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/fairline-sw.js");
  } catch {
    /* ignore */
  }
}
