"use client";

import { useEffect } from "react";

function isServiceWorkerSupported() {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    !!navigator.serviceWorker
  );
}

export function useServiceWorker(onMessage?: (event: MessageEvent) => void) {
  useEffect(() => {
    if (!isServiceWorkerSupported()) return;

    const sw = navigator.serviceWorker;

    // Register only if you have a SW file; if the original project already registers elsewhere,
    // this won’t break it — it simply ensures we do not crash on unsupported platforms.
    const register = async () => {
      try {
        // keep if your app actually has /sw.js or similar; otherwise it's harmless if it fails
        await sw.register("/sw.js").catch(() => {});
      } catch {
        // ignore
      }
    };

    register();

    if (!onMessage) return;

    const handler = (event: MessageEvent) => onMessage(event);

    sw.addEventListener("message", handler);

    return () => {
      sw.removeEventListener("message", handler);
    };
  }, [onMessage]);
}
