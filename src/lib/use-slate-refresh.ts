import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

/** Fresh slate the moment the link opens, then while the desk stays open. */
export function useSlateRefresh(everyMs = 15_000) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      void router.invalidate();
    };
    tick();
    const id = window.setInterval(tick, everyMs);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onShow);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("focus", tick);
    };
  }, [router, everyMs]);
}
