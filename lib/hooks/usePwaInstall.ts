"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = "dentapure_pwa_dismissed_time";
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days cooldown

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running in standalone mode (already installed & opened as app)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");
      
      setIsStandalone(isStandaloneMode);
      if (isStandaloneMode) {
        setIsInstalled(true);
        setShowBanner(false);
      }
    };

    checkStandalone();

    // Check iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    // Check dismissal cooldown
    const checkCooldown = () => {
      try {
        const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
        if (dismissedAt) {
          const timeSince = Date.now() - parseInt(dismissedAt, 10);
          if (timeSince < COOLDOWN_MS) {
            return false;
          }
        }
      } catch {
        // localStorage not available
      }
      return true;
    };

    // Handler for Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setIsInstallable(true);

      if (!isStandalone && checkCooldown()) {
        setShowBanner(true);
      }
    };

    // Handler for when app is installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      try {
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      } catch {
        // ignore
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Also for iOS: if not standalone and in cooldown ok, show iOS install prompt
    if (isIosDevice && !isStandalone && checkCooldown()) {
      // Small delay to prevent layout shift on initial load
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isStandalone]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (isIos) {
      setShowIosModal(true);
      return false;
    }

    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setShowBanner(false);
        setDeferredPrompt(null);
        return true;
      } else {
        // User dismissed the browser prompt
        dismissPrompt();
        return false;
      }
    } catch (err) {
      console.error("Error triggering PWA install prompt:", err);
      return false;
    }
  }, [deferredPrompt, isIos]);

  const dismissPrompt = useCallback(() => {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }, []);

  const openIosInstructions = useCallback(() => {
    setShowIosModal(true);
  }, []);

  const closeIosInstructions = useCallback(() => {
    setShowIosModal(false);
  }, []);

  return {
    isInstallable: isInstallable || isIos,
    isInstalled,
    isStandalone,
    isIos,
    showBanner,
    showIosModal,
    promptInstall,
    dismissPrompt,
    openIosInstructions,
    closeIosInstructions,
  };
}
