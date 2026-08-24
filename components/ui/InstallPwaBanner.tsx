"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Download, X, Share2, PlusSquare, CheckCircle2, Sparkles, Smartphone, Laptop } from "lucide-react";
import { usePwaInstall } from "../../lib/hooks/usePwaInstall";

export const InstallPwaBanner: React.FC = () => {
  const {
    showBanner,
    isInstalled,
    isIos,
    showIosModal,
    promptInstall,
    dismissPrompt,
    closeIosInstructions,
    openIosInstructions,
  } = usePwaInstall();

  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed or banner shouldn't show, don't render the floating banner
  if (isInstalled || !showBanner) {
    // Only render iOS modal if open
    if (showIosModal) {
      return <IosInstallModal onClose={closeIosInstructions} />;
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isIos) {
      openIosInstructions();
      return;
    }
    setIsInstalling(true);
    await promptInstall();
    setIsInstalling(false);
  };

  return (
    <>
      {/* Floating Bottom-Right / Bottom-Center Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-surface-container-lowest/95 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-2xl ring-1 ring-black/5 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md border border-outline-variant/30 shrink-0 bg-primary">
                <Image
                  src="/icons/icon-192x192.png"
                  alt="DentaPure"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-on-surface">Install DentaPure App</h4>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                    <Sparkles className="w-2.5 h-2.5" /> PWA
                  </span>
                </div>
                <p className="text-xs text-secondary mt-0.5">
                  Instant clinic access, fullscreen mode &amp; offline shell caching.
                </p>
              </div>
            </div>

            <button
              onClick={dismissPrompt}
              className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors shrink-0"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="flex items-center gap-2 text-[11px] text-secondary font-medium px-0.5">
            <span className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg">
              <Smartphone className="w-3 h-3 text-primary" /> Mobile &amp; Desktop
            </span>
            <span className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fast Offline Shell
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={dismissPrompt}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-medium text-secondary hover:text-on-surface hover:bg-surface-container transition-colors text-center"
            >
              Maybe Later
            </button>
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-on-primary shadow-sm flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {isIos ? "How to Install" : isInstalling ? "Installing..." : "Install Now"}
            </button>
          </div>
        </div>
      </div>

      {/* iOS Modal */}
      {showIosModal && <IosInstallModal onClose={closeIosInstructions} />}
    </>
  );
};

// Reusable Install Button for Sidebar or Settings
export const InstallPwaButton: React.FC<{
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "sidebar";
  showIcon?: boolean;
}> = ({ className = "", variant = "outline", showIcon = true }) => {
  const { isInstallable, isInstalled, promptInstall, isIos, openIosInstructions, showIosModal, closeIosInstructions } =
    usePwaInstall();

  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (isIos) {
      openIosInstructions();
    } else {
      promptInstall();
    }
  };

  if (variant === "sidebar") {
    return (
      <>
        <button
          onClick={handleClick}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-primary hover:bg-primary/10 transition-colors border border-primary/20 ${className}`}
          title="Install DentaPure Desktop/Mobile App"
        >
          {showIcon && <Download className="w-4 h-4 text-primary shrink-0" />}
          <span className="truncate">Install DentaPure App</span>
        </button>
        {showIosModal && <IosInstallModal onClose={closeIosInstructions} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
          variant === "primary"
            ? "bg-primary text-on-primary hover:bg-primary/90 shadow-sm"
            : variant === "secondary"
            ? "bg-secondary text-on-primary hover:bg-secondary/90"
            : "border border-outline-variant text-on-surface hover:bg-surface-container"
        } ${className}`}
      >
        {showIcon && <Download className="w-3.5 h-3.5" />}
        Install App
      </button>
      {showIosModal && <IosInstallModal onClose={closeIosInstructions} />}
    </>
  );
};

// iOS Safari Step-by-Step Instructions Modal
const IosInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md bg-primary shrink-0">
              <Image
                src="/icons/icon-192x192.png"
                alt="DentaPure"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">Install on iOS / Safari</h3>
              <p className="text-xs text-secondary">Add DentaPure to your Home Screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-Step Guide */}
        <div className="flex flex-col gap-3.5 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/15 text-xs text-on-surface">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-semibold text-on-surface mb-0.5">Tap the Share Button</p>
              <p className="text-secondary text-[11px] flex items-center gap-1.5">
                In Safari&apos;s bottom navigation bar, tap <Share2 className="w-3.5 h-3.5 text-primary inline" />.
              </p>
            </div>
          </div>

          <div className="border-t border-outline-variant/10" />

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-semibold text-on-surface mb-0.5">Select &quot;Add to Home Screen&quot;</p>
              <p className="text-secondary text-[11px] flex items-center gap-1.5">
                Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-primary inline" /> <strong>Add to Home Screen</strong>.
              </p>
            </div>
          </div>

          <div className="border-t border-outline-variant/10" />

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="font-semibold text-on-surface mb-0.5">Tap &quot;Add&quot;</p>
              <p className="text-secondary text-[11px]">
                Confirm in the top-right corner. DentaPure will now launch in standalone app mode!
              </p>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-on-primary transition-all duration-200 text-center shadow-sm cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
