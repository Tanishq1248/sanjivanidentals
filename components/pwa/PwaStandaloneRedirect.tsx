"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Automatically routes doctors to /admin when the website is opened
 * inside an installed PWA (Standalone display mode).
 */
export function PwaStandaloneRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running in PWA standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // If in standalone mode and on the root public landing page, route directly to /admin
    if (isStandalone && (pathname === "/" || pathname === "")) {
      router.replace("/admin");
    }
  }, [pathname, router]);

  return null;
}
