"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/Button";
import { Download } from "./ui/Icons";
import { appStore } from "@/lib/store";

type ServiceWorkerMessage =
  | { type: "download-ready"; url: string; filename?: string }
  | { type: string; [key: string]: unknown };

function isServiceWorkerSupported() {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    !!navigator.serviceWorker
  );
}

function isChromeLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();

  // Chromium-based (Chrome/Edge) but not iOS Chrome (which is Safari under the hood)
  const isChromium = ua.includes("chrome") || ua.includes("chromium");
  const isEdge = ua.includes("edg/");
  const isIOS = ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod");

  return (isChromium || isEdge) && !isIOS;
}

export default function DownloadButton() {
  const latestAudioUrl = appStore.useState((s) => s.latestAudioUrl);
  const voice = appStore.useState((s) => s.voice);
  const vibe = appStore.useState((s) => s.selectedEntry?.name ?? "custom");

  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filename = useMemo(() => {
    // Keep original intent: Chrome -> wav, others -> mp3
    return `openai-fm-${voice}-${vibe}.${isChromeLike() ? "wav" : "mp3"}`;
  }, [voice, vibe]);

  const cleanupListenerRef = useRef<(() => void) | null>(null);

  const clearListener = useCallback(() => {
    if (cleanupListenerRef.current) {
      cleanupListenerRef.current();
      cleanupListenerRef.current = null;
    }
  }, []);

  const waitForServiceWorkerMessage = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isServiceWorkerSupported()) {
        reject(new Error("Service workers are not supported in this environment."));
        return;
      }

      const handler = (event: MessageEvent<ServiceWorkerMessage>) => {
        const data: any = event.data;
        if (!data || typeof data !== "object") return;

        if (data.type === "download-ready" && data.url) {
          const a = document.createElement("a");
          a.href = data.url;
          a.download = data.filename || filename;
          document.body.appendChild(a);
          a.click();
          a.remove();

          resolve();
          clearListener();
        }
      };

      // IMPORTANT: guard addEventListener on mobile/WebView
      navigator.serviceWorker?.addEventListener?.("message", handler);

      cleanupListenerRef.current = () => {
        navigator.serviceWorker?.removeEventListener?.("message", handler);
      };
    });
  }, [clearListener, filename]);

  useEffect(() => {
    return () => {
      clearListener();
    };
  }, [clearListener]);

  const handleDownload = useCallback(async () => {
    setError(null);

    if (!latestAudioUrl) {
      setError("No audio to download yet.");
      return;
    }

    setDownloading(true);

    try {
      if (isServiceWorkerSupported()) {
        const waitPromise = waitForServiceWorkerMessage();

        // If your SW listens for a different message shape, adjust this to match.
        navigator.serviceWorker?.controller?.postMessage({
          type: "download",
          url: latestAudioUrl,
          filename,
        });

        await waitPromise;
      } else {
        // Fallback: direct download
        const a = document.createElement("a");
        a.href = latestAudioUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e: any) {
      setError(e?.message || "Download failed.");
      clearListener();
    } finally {
      setDownloading(false);
    }
  }, [clearListener, filename, latestAudioUrl, waitForServiceWorkerMessage]);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        color="neutral"
        onClick={handleDownload}
        disabled={!latestAudioUrl || downloading}
        aria-label="Download audio"
      >
        <Download />
        <span className="ml-2">{downloading ? "Preparing…" : "Download"}</span>
      </Button>

      {error && <div className="text-xs opacity-70">{error}</div>}
    </div>
  );
}
