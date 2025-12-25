"use client";

import { useEffect, useState } from "react";

export function useBodyScrollable() {
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const checkScrollable = () => {
      const body = document.body;
      const html = document.documentElement;

      const scrollHeight = Math.max(body.scrollHeight, html.scrollHeight);
      const clientHeight = Math.max(body.clientHeight, html.clientHeight);

      setIsScrollable(scrollHeight > clientHeight);
    };

    checkScrollable();
    window.addEventListener("resize", checkScrollable);

    return () => {
      window.removeEventListener("resize", checkScrollable);
    };
  }, []);

  return isScrollable;
}
