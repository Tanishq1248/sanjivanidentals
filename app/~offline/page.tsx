"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { WifiOff, RefreshCw, PhoneCall, ShieldAlert, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      window.location.reload();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-level-2 flex flex-col items-center">
        {/* App Logo */}
        <div className="relative w-16 h-16 mb-6 rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 bg-surface">
          <Image
            src="/icons/icon-192x192.png"
            alt="DentaPure Logo"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Offline Icon Badge */}
        <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 ring-8 ring-amber-500/5">
          <WifiOff className="w-7 h-7 animate-pulse" />
        </div>

        {/* Heading & Details */}
        <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-2">
          You&apos;re Currently Offline
        </h1>
        <p className="text-sm text-secondary leading-relaxed mb-6">
          DentaPure couldn&apos;t connect to the clinic server. Please check your WiFi or mobile data connection.
        </p>

        {/* Status Callout */}
        <div className="w-full bg-surface-container-low rounded-2xl p-4 mb-6 text-left border border-outline-variant/15 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-on-surface-variant leading-relaxed">
            <span className="font-semibold text-on-surface block mb-0.5">Offline Shell Active</span>
            Cached application shells and patient workspace resources remain accessible. New changes will sync automatically upon reconnection.
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-semibold text-sm py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Checking Connection..." : "Retry Connection"}
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-surface-container-high hover:bg-surface-dim text-on-surface font-medium text-sm py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-secondary" />
            Go Back
          </button>
        </div>

        {/* Clinic Assistance */}
        <div className="mt-8 pt-6 border-t border-outline-variant/20 w-full flex items-center justify-center gap-2 text-xs text-secondary">
          <PhoneCall className="w-3.5 h-3.5 text-primary" />
          <span>Clinic Reception Assistance: <strong className="text-on-surface">+91 98765 43210</strong></span>
        </div>
      </div>
    </div>
  );
}
