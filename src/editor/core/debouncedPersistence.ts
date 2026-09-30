let pending: (() => void) | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let listening = false;

/** Coalesce editor gestures; flush the latest state before the browser leaves. */
export function flushPendingPersistence() {
  if (timer) clearTimeout(timer);
  timer = undefined;
  const save = pending;
  pending = undefined;
  save?.();
}
export function schedulePersistence(save: () => void) {
  pending = save;
  if (timer) clearTimeout(timer);
  timer = setTimeout(flushPendingPersistence, 250);
  if (typeof window !== "undefined" && !listening) {
    listening = true;
    window.addEventListener("pagehide", flushPendingPersistence);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushPendingPersistence();
    });
  }
}
